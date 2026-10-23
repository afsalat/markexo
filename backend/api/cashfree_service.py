"""
Cashfree Payment Gateway integration for VorionMart.
Supports Cashfree API v2023-08-01 for Orders, Verification, and Webhooks.
"""
import json
import logging
import urllib.request
import urllib.error
from decimal import Decimal
from typing import Optional, Dict, Any

from django.conf import settings
from api.models import SiteSetting, Order

logger = logging.getLogger(__name__)

SANDBOX_URL = "https://sandbox.cashfree.com/pg"
PRODUCTION_URL = "https://api.cashfree.com/pg"


def get_cashfree_config() -> Dict[str, Any]:
    """Retrieve Cashfree configuration from SiteSetting with fallback to settings.py."""
    site_setting = SiteSetting.objects.first()

    enabled = getattr(site_setting, 'cashfree_enabled', False)
    mode = getattr(site_setting, 'cashfree_mode', 'SANDBOX') or 'SANDBOX'
    app_id = (getattr(site_setting, 'cashfree_app_id', '') or getattr(settings, 'CASHFREE_APP_ID', '')).strip()
    secret_key = (getattr(site_setting, 'cashfree_secret_key', '') or getattr(settings, 'CASHFREE_SECRET_KEY', '')).strip()
    api_version = (getattr(site_setting, 'cashfree_api_version', '') or '2023-08-01').strip()

    base_url = PRODUCTION_URL if mode.upper() == 'PRODUCTION' else SANDBOX_URL

    return {
        'enabled': enabled,
        'mode': mode.upper(),
        'app_id': app_id,
        'secret_key': secret_key,
        'api_version': api_version,
        'base_url': base_url,
    }


def get_headers(app_id: str, secret_key: str, api_version: str = "2023-08-01") -> Dict[str, str]:
    return {
        "x-client-id": app_id,
        "x-client-secret": secret_key,
        "x-api-version": api_version,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def create_cashfree_order(order: Order, customer, return_url: Optional[str] = None) -> Dict[str, Any]:
    """
    Creates an order on Cashfree Payment Gateway and returns payment_session_id.
    """
    cfg = get_cashfree_config()

    if not cfg['app_id'] or not cfg['secret_key']:
        return {
            'success': False,
            'error': 'Cashfree API credentials are not configured in Site Settings.'
        }

    # Normalize customer phone for Cashfree (must be 10 digits)
    phone_digits = ''.join(c for c in str(customer.phone or '') if c.isdigit())
    if len(phone_digits) > 10:
        phone_digits = phone_digits[-10:]
    elif len(phone_digits) < 10:
        phone_digits = '9999999999'

    amount = float(Decimal(str(order.total_amount or 0)).quantize(Decimal('0.01')))

    resolved_return_url = return_url or f"https://vorionmart.com/checkout?order_id={order.order_id}&status={{order_status}}"

    payload = {
        "order_id": order.order_id,
        "order_amount": amount,
        "order_currency": "INR",
        "customer_details": {
            "customer_id": f"cust_{customer.id}",
            "customer_name": customer.name or "Customer",
            "customer_email": customer.email or "customer@vorionmart.com",
            "customer_phone": phone_digits,
        },
        "order_meta": {
            "return_url": resolved_return_url,
        },
        "order_note": f"VorionMart Order #{order.order_id}",
    }

    url = f"{cfg['base_url']}/orders"
    headers = get_headers(cfg['app_id'], cfg['secret_key'], cfg['api_version'])

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers=headers,
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            logger.info("Cashfree order created for %s: cf_order_id=%s", order.order_id, data.get('cf_order_id'))
            return {
                'success': True,
                'order_id': order.order_id,
                'cf_order_id': data.get('cf_order_id'),
                'payment_session_id': data.get('payment_session_id'),
                'order_status': data.get('order_status'),
                'mode': cfg['mode'],
            }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        logger.error("Cashfree API HTTP error %d: %s", e.code, error_body)
        try:
            err_json = json.loads(error_body)
            err_msg = err_json.get('message') or err_json.get('error') or error_body
        except Exception:
            err_msg = error_body
        return {
            'success': False,
            'error': f"Cashfree error ({e.code}): {err_msg}",
            'status_code': e.code,
        }
    except Exception as e:
        logger.exception("Failed to create Cashfree order for %s: %s", order.order_id, str(e))
        return {
            'success': False,
            'error': f"Payment gateway connection error: {str(e)}",
        }


def verify_cashfree_order(order_id: str) -> Dict[str, Any]:
    """
    Checks Cashfree order status by order_id.
    """
    cfg = get_cashfree_config()

    if not cfg['app_id'] or not cfg['secret_key']:
        return {
            'success': False,
            'error': 'Cashfree credentials not configured.'
        }

    url = f"{cfg['base_url']}/orders/{order_id}"
    headers = get_headers(cfg['app_id'], cfg['secret_key'], cfg['api_version'])

    try:
        req = urllib.request.Request(url, headers=headers, method='GET')
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            order_status = data.get('order_status', '').upper()
            is_paid = (order_status == 'PAID')
            return {
                'success': True,
                'order_id': order_id,
                'order_status': order_status,
                'is_paid': is_paid,
                'order_amount': data.get('order_amount'),
                'cf_order_id': data.get('cf_order_id'),
                'raw': data,
            }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        logger.error("Cashfree verify HTTP error %d: %s", e.code, error_body)
        return {
            'success': False,
            'error': f"Cashfree verification error: {error_body}",
        }
    except Exception as e:
        logger.exception("Cashfree verify exception: %s", str(e))
        return {
            'success': False,
            'error': str(e),
        }


def test_cashfree_credentials(app_id: str, secret_key: str, mode: str = "SANDBOX") -> Dict[str, Any]:
    """
    Validates provided Cashfree credentials by making a test call.
    """
    base_url = PRODUCTION_URL if mode.upper() == "PRODUCTION" else SANDBOX_URL
    headers = get_headers(app_id.strip(), secret_key.strip())

    # We test by querying a dummy order id - if auth is good, it returns 404 (Order Not Found) instead of 401 (Unauthorized)
    url = f"{base_url}/orders/test_credential_ping"
    try:
        req = urllib.request.Request(url, headers=headers, method='GET')
        with urllib.request.urlopen(req, timeout=10) as resp:
            return {'success': True, 'message': 'Cashfree credentials verified successfully!'}
    except urllib.error.HTTPError as e:
        if e.code == 404:
            # 404 means authentication succeeded and Cashfree verified the API key!
            return {'success': True, 'message': 'Cashfree credentials verified successfully!'}
        elif e.code in (401, 403):
            return {'success': False, 'error': 'Invalid App ID or Secret Key. Cashfree authentication failed (401/403).'}
        else:
            error_body = e.read().decode('utf-8')
            return {'success': False, 'error': f"Cashfree response ({e.code}): {error_body}"}
    except Exception as e:
        return {'success': False, 'error': f"Network or connection error: {str(e)}"}
