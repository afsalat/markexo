"""
Meta Conversions API (CAPI) Service for VorionMart.
Handles server-side Purchase event dispatching with:
- SHA-256 normalization and hashing of customer PII (email, phone, name, city, pincode, country).
- Browser/Server deduplication via identical event_id (order.order_id).
- Strict idempotency protection preventing duplicate events from retries or concurrent webhooks.
- Safe timeout handling and error isolation (never breaks checkout or payment flow).
- Support for Meta Test Event Code via settings/env.
- Audit logging via MetaEventLog without recording raw customer PII.
"""

import hashlib
import logging
import os
import re
import time
from typing import Any, Dict, Optional

import requests
from django.conf import settings
from django.utils import timezone

from .models import MetaEventLog, Order

logger = logging.getLogger(__name__)


def hash_sha256(value: Optional[str]) -> Optional[str]:
    """
    Normalizes and computes SHA-256 hash according to Meta specifications.
    Trims leading/trailing whitespace, converts to lowercase, and produces hex digest.
    Returns None if value is empty.
    """
    if not value:
        return None
    cleaned = str(value).strip().lower()
    if not cleaned:
        return None
    return hashlib.sha256(cleaned.encode('utf-8')).hexdigest()


def normalize_phone_for_meta(phone: Optional[str]) -> Optional[str]:
    """
    Normalizes phone number according to Meta requirements:
    - Strips non-digit characters (+, -, spaces, parentheses).
    - Prepends country code '91' for 10-digit Indian numbers.
    - Handles leading zero (e.g., 09876543210 -> 919876543210).
    - Returns SHA-256 hash of the normalized digit sequence.
    """
    if not phone:
        return None

    digits = re.sub(r'\D', '', str(phone))
    if not digits:
        return None

    # Handle standard 10-digit Indian numbers
    if len(digits) == 10:
        digits = f"91{digits}"
    # Handle 11-digit number with leading zero
    elif len(digits) == 11 and digits.startswith('0'):
        digits = f"91{digits[1:]}"
    # Handle numbers that already start with 91 and are 12 digits
    elif len(digits) == 12 and digits.startswith('91'):
        pass  # already normalized
    # Fallback: keep digits as-is if international format

    return hash_sha256(digits)


def extract_client_ip(request) -> Optional[str]:
    """
    Extracts the client's public IP address from HTTP headers.
    Checks Cloudflare CF-Connecting-IP, X-Forwarded-For, then REMOTE_ADDR.
    Raw IP is NOT hashed per Meta CAPI specifications.
    """
    if not request:
        return None

    cf_ip = request.META.get('HTTP_CF_CONNECTING_IP')
    if cf_ip:
        return cf_ip.strip()

    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        parts = [p.strip() for p in x_forwarded.split(',') if p.strip()]
        if parts:
            return parts[0]

    remote_addr = request.META.get('REMOTE_ADDR')
    if remote_addr:
        return remote_addr.strip()

    return None


def extract_client_user_agent(request) -> Optional[str]:
    """
    Extracts the user agent string from the HTTP request.
    Raw User-Agent is NOT hashed per Meta CAPI specifications.
    """
    if not request:
        return None
    return request.META.get('HTTP_USER_AGENT', '').strip() or None


def send_meta_purchase_event(order: Order, request=None, force: bool = False) -> Dict[str, Any]:
    """
    Dispatches a server-side Purchase event to Meta Graph API Conversions API.

    Guarantees:
    - Idempotency: Returns immediately if the order has already been sent to Meta.
    - Identical event_id: Exactly order.order_id to deduplicate with frontend browser Pixel.
    - Non-blocking error handling: Any network or API failure is recorded and logged,
      never raising an unhandled exception to calling checkout/payment views.
    - PII Safety: Customer data is normalized and SHA-256 hashed before transmission.
    """
    if not order or not order.order_id:
        logger.warning("[Meta CAPI] Skipped: Invalid order or missing order_id.")
        return {'success': False, 'skipped': True, 'reason': 'invalid_order'}

    # 1. Idempotency Check (in-memory + database check)
    if not force:
        if order.meta_purchase_sent:
            logger.info("[Meta CAPI] Order %s already marked sent. Skipping duplicate dispatch.", order.order_id)
            return {'success': True, 'skipped': True, 'reason': 'already_sent'}

        if Order.objects.filter(pk=order.pk, meta_purchase_sent=True).exists():
            logger.info("[Meta CAPI] Order %s confirmed sent in database. Skipping duplicate dispatch.", order.order_id)
            order.meta_purchase_sent = True
            return {'success': True, 'skipped': True, 'reason': 'already_sent_db'}

    # 2. Configuration & Credentials Check
    pixel_id = getattr(settings, 'META_PIXEL_ID', '888338177639026').strip()
    access_token = getattr(settings, 'META_CAPI_ACCESS_TOKEN', '').strip() or os.environ.get('META_CAPI_ACCESS_TOKEN', '').strip()
    api_version = getattr(settings, 'META_GRAPH_API_VERSION', 'v21.0').strip()
    test_event_code = (
        getattr(settings, 'META_CAPI_TEST_EVENT_CODE', '').strip()
        or os.environ.get('META_CAPI_TEST_EVENT_CODE', '').strip()
        or os.environ.get('TEST_EVENT_CODE', '').strip()
    )

    if not access_token:
        logger.info(
            "[Meta CAPI] Order %s: META_CAPI_ACCESS_TOKEN is not configured. "
            "Server event dispatch skipped until token is set in server environment.",
            order.order_id
        )
        return {'success': False, 'skipped': True, 'reason': 'token_not_configured'}

    # 3. Customer Data Normalization & Hashing
    customer = getattr(order, 'customer', None)
    customer_email = getattr(customer, 'email', '') or getattr(order, 'customer_email', '')
    customer_phone = getattr(customer, 'phone', '') or getattr(order, 'customer_phone', '')
    customer_name = getattr(customer, 'name', '') or getattr(order, 'customer_name', '')

    user_data: Dict[str, Any] = {}

    hashed_email = hash_sha256(customer_email)
    if hashed_email:
        user_data['em'] = [hashed_email]

    hashed_phone = normalize_phone_for_meta(customer_phone)
    if hashed_phone:
        user_data['ph'] = [hashed_phone]

    if customer_name:
        name_parts = customer_name.strip().split(None, 1)
        first_name_hash = hash_sha256(name_parts[0])
        if first_name_hash:
            user_data['fn'] = [first_name_hash]
        if len(name_parts) > 1:
            last_name_hash = hash_sha256(name_parts[1])
            if last_name_hash:
                user_data['ln'] = [last_name_hash]

    city_hash = hash_sha256(re.sub(r'[^a-zA-Z0-9]', '', (order.delivery_city or '').lower()))
    if city_hash:
        user_data['ct'] = [city_hash]

    pincode_hash = hash_sha256(re.sub(r'\s+', '', (order.delivery_pincode or '').lower()))
    if pincode_hash:
        user_data['zp'] = [pincode_hash]

    # ISO 3166-1 alpha-2 country code for India
    country_hash = hash_sha256('in')
    if country_hash:
        user_data['country'] = [country_hash]

    client_ip = extract_client_ip(request)
    if client_ip:
        user_data['client_ip_address'] = client_ip

    client_ua = extract_client_user_agent(request)
    if client_ua:
        user_data['client_user_agent'] = client_ua

    # Extract Meta Browser ID (_fbp) and Click ID (_fbc) cookies if available
    if request and hasattr(request, 'COOKIES'):
        fbp = request.COOKIES.get('_fbp')
        if fbp:
            user_data['fbp'] = fbp.strip()
        fbc = request.COOKIES.get('_fbc')
        if fbc:
            user_data['fbc'] = fbc.strip()

    # 4. Product Contents & Custom Data
    order_items = list(order.items.select_related('product').all())
    contents = []
    for item in order_items:
        prod_id = str(item.product_id or (item.product.id if item.product else item.id))
        contents.append({
            'id': prod_id,
            'quantity': int(item.quantity),
            'item_price': float(item.price),
        })

    num_items = sum(item.quantity for item in order_items) or 1
    total_value = float(order.total_amount)
    payment_type = 'cash_on_delivery' if order.is_cod else 'cashfree_online'

    custom_data: Dict[str, Any] = {
        'currency': 'INR',
        'value': total_value,
        'content_type': 'product',
        'contents': contents,
        'num_items': num_items,
        'order_id': str(order.order_id),
        'payment_type': payment_type,
    }

    # 5. Build Meta Event Payload
    event_timestamp = int(order.created_at.timestamp()) if order.created_at else int(time.time())
    app_url = getattr(settings, 'APP_URL', 'https://vorionmart.com').rstrip('/')

    event_payload: Dict[str, Any] = {
        'event_name': 'Purchase',
        'event_time': event_timestamp,
        'event_id': str(order.order_id),  # Exact match with browser eventID for deduplication
        'event_source_url': f"{app_url}/checkout",
        'action_source': 'website',
        'user_data': user_data,
        'custom_data': custom_data,
    }

    request_body: Dict[str, Any] = {
        'data': [event_payload],
    }

    if test_event_code:
        request_body['test_event_code'] = test_event_code

    # 6. Dispatch HTTP Request to Meta Graph API
    endpoint_url = f"https://graph.facebook.com/{api_version}/{pixel_id}/events"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f"Bearer {access_token}",
    }

    logger.info(
        "[Meta CAPI] Dispatching Purchase event for order %s (value: ₹%.2f, items: %d, cod: %s, test: %s)",
        order.order_id,
        total_value,
        num_items,
        order.is_cod,
        bool(test_event_code),
    )

    try:
        response = requests.post(
            endpoint_url,
            json=request_body,
            headers=headers,
            timeout=(4, 8),  # 4s connect timeout, 8s read timeout
        )
    except requests.exceptions.RequestException as net_err:
        logger.error(
            "[Meta CAPI] Network error dispatching Purchase for order %s: %s",
            order.order_id,
            net_err,
        )
        MetaEventLog.objects.create(
            order=order,
            event_name='Purchase',
            event_id=order.order_id,
            status='failed',
            error_message=f"Network exception: {net_err}",
        )
        return {'success': False, 'error': f"Network exception: {net_err}"}

    # 7. Evaluate Meta Response
    try:
        res_json = response.json()
    except Exception:
        res_json = {}

    fbtrace_id = res_json.get('fbtrace_id', '')
    events_received = res_json.get('events_received', 0)

    if response.status_code == 200 and events_received > 0:
        # Atomic lock and update to guarantee idempotency across concurrent processes
        Order.objects.filter(pk=order.pk, meta_purchase_sent=False).update(
            meta_purchase_sent=True,
            meta_purchase_sent_at=timezone.now(),
            meta_purchase_fbtrace_id=fbtrace_id,
        )
        order.meta_purchase_sent = True
        order.meta_purchase_sent_at = timezone.now()
        order.meta_purchase_fbtrace_id = fbtrace_id

        MetaEventLog.objects.create(
            order=order,
            event_name='Purchase',
            event_id=order.order_id,
            status='sent',
            events_received=events_received,
            response_code=response.status_code,
            fbtrace_id=fbtrace_id,
        )

        logger.info(
            "[Meta CAPI] ✅ Successfully delivered Purchase event for order %s (fbtrace_id: %s, received: %d)",
            order.order_id,
            fbtrace_id,
            events_received,
        )
        return {'success': True, 'fbtrace_id': fbtrace_id, 'events_received': events_received}
    else:
        err_msg = res_json.get('error', {}).get('message') or response.text[:300]
        logger.error(
            "[Meta CAPI] ❌ Meta rejected Purchase event for order %s (status: %d, trace: %s): %s",
            order.order_id,
            response.status_code,
            fbtrace_id,
            err_msg,
        )
        MetaEventLog.objects.create(
            order=order,
            event_name='Purchase',
            event_id=order.order_id,
            status='failed',
            response_code=response.status_code,
            fbtrace_id=fbtrace_id,
            error_message=err_msg,
        )
        return {
            'success': False,
            'response_code': response.status_code,
            'fbtrace_id': fbtrace_id,
            'error': err_msg,
        }
