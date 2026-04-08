import base64
import hashlib
import hmac
import json
import logging
from decimal import Decimal
from typing import Optional
from urllib import error, parse, request as urllib_request

from django.conf import settings


logger = logging.getLogger(__name__)


def format_currency(amount: Decimal) -> str:
    return f"Rs. {Decimal(amount or 0):,.2f}"


def normalize_phone_digits(value: str) -> str:
    return ''.join(ch for ch in str(value or '') if ch.isdigit())


def build_whatsapp_address(value: str) -> str:
    raw_value = str(value or '').strip()
    if raw_value.startswith('whatsapp:'):
        return raw_value

    digits = normalize_phone_digits(raw_value)
    if not digits:
        return ''

    if len(digits) == 10:
        digits = f'91{digits}'

    return f'whatsapp:+{digits}'


def twilio_is_configured() -> bool:
    return bool(
        settings.TWILIO_ACCOUNT_SID
        and settings.TWILIO_AUTH_TOKEN
        and settings.TWILIO_WHATSAPP_FROM
    )


def build_track_order_url(order) -> str:
    base_url = getattr(settings, 'APP_URL', '').rstrip('/')
    if not base_url:
        return ''
    return f"{base_url}/track-order?id={order.order_id}"


def _post_twilio_message(payload: dict) -> Optional[dict]:
    if not twilio_is_configured():
        logger.info('Twilio WhatsApp is not configured. Skipping outbound message.')
        return None

    endpoint = (
        f"https://api.twilio.com/2010-04-01/Accounts/"
        f"{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    )
    encoded_payload = parse.urlencode(payload).encode('utf-8')
    req = urllib_request.Request(endpoint, data=encoded_payload, method='POST')
    credentials = f"{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}".encode('utf-8')
    req.add_header('Authorization', f"Basic {base64.b64encode(credentials).decode('ascii')}")
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')

    try:
        with urllib_request.urlopen(req, timeout=20) as response:
            body = response.read().decode('utf-8')
            return json.loads(body) if body else {}
    except error.HTTPError as exc:
        response_body = exc.read().decode('utf-8', errors='replace')
        logger.error('Twilio WhatsApp request failed: %s %s', exc.code, response_body)
    except Exception as exc:  # pragma: no cover - defensive logging for network/runtime failures
        logger.exception('Unexpected Twilio WhatsApp failure: %s', exc)
    return None


def send_whatsapp_message(
    *,
    to_number: str,
    body: str = '',
    content_sid: str = '',
    content_variables: Optional[dict] = None,
) -> Optional[dict]:
    to_address = build_whatsapp_address(to_number)
    from_address = build_whatsapp_address(settings.TWILIO_WHATSAPP_FROM)

    if not to_address or not from_address:
        logger.info('WhatsApp message skipped because from/to address is missing.')
        return None

    payload = {
        'From': from_address,
        'To': to_address,
    }

    if settings.TWILIO_WHATSAPP_STATUS_CALLBACK_URL:
        payload['StatusCallback'] = settings.TWILIO_WHATSAPP_STATUS_CALLBACK_URL

    if content_sid:
        payload['ContentSid'] = content_sid
        if content_variables:
            payload['ContentVariables'] = json.dumps(content_variables)
    else:
        payload['Body'] = body

    return _post_twilio_message(payload)


def send_order_confirmation_whatsapp(order):
    track_url = build_track_order_url(order)
    items_summary = ', '.join(
        f"{item.product_name} x{item.quantity}" for item in order.items.all()[:3]
    )
    if order.items.count() > 3:
        items_summary = f"{items_summary}, +{order.items.count() - 3} more items"

    template_sid = settings.TWILIO_WHATSAPP_ORDER_CONFIRMATION_CONTENT_SID
    if template_sid:
        return send_whatsapp_message(
            to_number=order.customer.phone,
            content_sid=template_sid,
            content_variables={
                '1': order.customer.name,
                '2': order.order_id,
                '3': format_currency(order.total_amount),
                '4': track_url or 'Track order on our website',
            },
        )

    body = (
        f"Hi {order.customer.name}, your order {order.order_id} has been received successfully. "
        f"Total: {format_currency(order.total_amount)}. "
        f"Items: {items_summary}. "
        f"{f'Track here: {track_url}' if track_url else 'We will update you soon.'}"
    )
    return send_whatsapp_message(to_number=order.customer.phone, body=body)


def send_order_alert_whatsapp(order, alert_number: str):
    if not alert_number:
        logger.info('Business order alert skipped because no WhatsApp alert number is configured.')
        return None

    template_sid = settings.TWILIO_WHATSAPP_ORDER_ALERT_CONTENT_SID
    if template_sid:
        return send_whatsapp_message(
            to_number=alert_number,
            content_sid=template_sid,
            content_variables={
                '1': order.order_id,
                '2': order.customer.name,
                '3': order.customer.phone,
                '4': format_currency(order.total_amount),
            },
        )

    body = (
        f"New order received: {order.order_id}\n"
        f"Customer: {order.customer.name}\n"
        f"Phone: {order.customer.phone}\n"
        f"Amount: {format_currency(order.total_amount)}\n"
        f"City: {order.delivery_city}"
    )
    return send_whatsapp_message(to_number=alert_number, body=body)


def build_twiml_message(body: str) -> str:
    safe_body = (
        str(body or '')
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
    )
    return f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{safe_body}</Message></Response>'


def is_valid_twilio_signature(request_obj) -> bool:
    if not settings.TWILIO_VALIDATE_WEBHOOK_SIGNATURE:
        return True

    signature = request_obj.headers.get('X-Twilio-Signature', '')
    if not signature or not settings.TWILIO_AUTH_TOKEN:
        return False

    url = request_obj.build_absolute_uri()
    payload = url
    for key in sorted(request_obj.POST.keys()):
        payload += key + request_obj.POST.get(key, '')

    digest = hmac.new(
        settings.TWILIO_AUTH_TOKEN.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha1,
    ).digest()
    expected = base64.b64encode(digest).decode('utf-8')
    return hmac.compare_digest(expected, signature)
