import logging
from decimal import Decimal
from email.mime.image import MIMEImage
from html import escape
from pathlib import Path
from typing import Optional

from django.conf import settings
from django.core.mail import EmailMultiAlternatives


logger = logging.getLogger(__name__)
LOGO_CID = 'vorionmart-logo'


def format_currency(amount) -> str:
    value = Decimal(amount or 0)
    return f"Rs. {value:,.2f}"


def get_logo_path() -> Path:
    return Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'logo-white-text.png'


def build_logo_src() -> str:
    return f"cid:{LOGO_CID}"


def attach_logo_image(message: EmailMultiAlternatives):
    logo_path = get_logo_path()
    if not logo_path.exists():
        logger.warning("Order email logo not found at %s", logo_path)
        return

    logo = MIMEImage(logo_path.read_bytes(), _subtype='png')
    logo.add_header('Content-ID', f'<{LOGO_CID}>')
    logo.add_header('Content-Disposition', 'inline', filename=logo_path.name)
    message.attach(logo)


def build_product_url(item) -> Optional[str]:
    app_url = getattr(settings, 'APP_URL', '').rstrip('/')
    product = getattr(item, 'product', None)
    slug = getattr(product, 'slug', '') if product else ''
    if not app_url or not slug:
        return None
    return f"{app_url}/products/{slug}"


def build_review_url(item) -> Optional[str]:
    product_url = build_product_url(item)
    if not product_url:
        return None
    return f"{product_url}?review=1#reviews"


def build_delivery_address(order) -> str:
    parts = [
        order.delivery_address,
        order.delivery_city,
        order.delivery_pincode,
    ]
    return ', '.join(part for part in parts if part)


def build_return_reason(order) -> Optional[str]:
    notes = getattr(order, 'notes', '') or ''
    if '[Return Reason]:' not in notes:
        return None

    reason = notes.split('[Return Reason]:', 1)[1].strip()
    if '\n[' in reason:
        reason = reason.split('\n[', 1)[0].strip()
    return reason or None


def build_items_text(order) -> list[str]:
    lines = []
    for item in order.items.all():
        line = f"- {item.product_name} x {item.quantity} = {format_currency(item.price * item.quantity)}"
        product_url = build_product_url(item)
        if product_url:
            line = f"{line} | Product link: {product_url}"
        review_url = build_review_url(item)
        if review_url and order.status in {'delivered', 'completed'}:
            line = f"{line} | Review: {review_url}"
        lines.append(line)
    return lines


def build_items_html(order) -> str:
    rows = []
    for item in order.items.all():
        product_url = build_product_url(item)
        review_url = build_review_url(item)
        action_html = (
            f"<a href=\"{escape(product_url)}\" "
            "style=\"display:inline-block;padding:8px 12px;border-radius:999px;background:#0f172a;color:#ffffff;"
            "font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;\">View Product</a>"
            if product_url else
            "<span style=\"font-size:12px;color:#94a3b8;\">Unavailable</span>"
        )
        if review_url and order.status in {'delivered', 'completed'}:
            action_html += (
                f" <a href=\"{escape(review_url)}\" "
                "style=\"display:inline-block;padding:8px 12px;border-radius:999px;background:#14b8a6;color:#ffffff;"
                "font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;margin-left:8px;\">Review Product</a>"
            )
        rows.append(
            "<tr>"
            f"<td style=\"padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 600;\">{escape(item.product_name)}</td>"
            f"<td style=\"padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: center;\">{item.quantity}</td>"
            f"<td style=\"padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; white-space: nowrap;\">{escape(format_currency(item.price * item.quantity))}</td>"
            f"<td style=\"padding: 14px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;\">{action_html}</td>"
            "</tr>"
        )
    return ''.join(rows)


def get_status_badge_style(label: str) -> str:
    normalized = label.lower()
    if 'delivered' in normalized or 'confirmed' in normalized or 'received' in normalized:
        return 'background:#dcfce7;color:#166534;'
    if 'pending' in normalized or 'verification' in normalized:
        return 'background:#fef3c7;color:#92400e;'
    if 'shipped' in normalized or 'out for delivery' in normalized:
        return 'background:#dbeafe;color:#1d4ed8;'
    if 'cancelled' in normalized or 'failed' in normalized or 'rto' in normalized or 'returned' in normalized:
        return 'background:#fee2e2;color:#b91c1c;'
    if 'refund' in normalized:
        return 'background:#ede9fe;color:#6d28d9;'
    return 'background:#e5e7eb;color:#374151;'


def build_detail_row(label: str, value: str, accent: bool = False) -> str:
    value_style = "font-size:14px;color:#0f172a;font-weight:700;" if accent else "font-size:14px;color:#111827;font-weight:600;"
    return (
        "<tr>"
        f"<td style=\"padding: 10px 0; color: #6b7280; font-size: 13px; width: 160px; vertical-align: top;\">{escape(label)}</td>"
        f"<td style=\"padding: 10px 0; {value_style}\">{escape(value)}</td>"
        "</tr>"
    )


def send_order_email(order, subject: str, intro: str):
    recipient = (getattr(order.customer, 'email', '') or '').strip()
    if not recipient:
        logger.info("Skipping order email for order %s because customer email is empty.", order.order_id)
        return

    customer_name = order.customer.name or 'Customer'
    order_status = order.get_status_display()
    payment_status = order.get_payment_status_display()
    refund_status = order.get_refund_status_display() if order.refund_status else 'Not Applicable'
    delivery_address = build_delivery_address(order)
    return_reason = build_return_reason(order)
    item_lines = build_items_text(order)

    text_lines = [
        f"Hi {customer_name},",
        "",
        intro,
        "",
        "Order details",
        f"Order ID: {order.order_id}",
        f"Order status: {order_status}",
        f"Payment status: {payment_status}",
        f"Refund status: {refund_status}",
        f"Total amount: {format_currency(order.total_amount)}",
        f"Delivery address: {delivery_address}",
        "",
        "Items",
        *item_lines,
    ]

    if order.cancellation_reason:
        text_lines.extend(["", f"Cancellation reason: {order.cancellation_reason}"])

    if return_reason:
        text_lines.extend(["", f"Return reason: {return_reason}"])

    if order.notes:
        text_lines.extend(["", f"Notes: {order.notes}"])

    if order.status in {'delivered', 'completed'}:
        text_lines.extend([
            "",
            "We'd love your feedback. Use the product review link beside each delivered item to leave a review.",
        ])

    text_lines.extend(["", "Thank you,", "VorionMart"])

    delivered_feedback_html = ""
    if order.status in {'delivered', 'completed'}:
        delivered_feedback_html = (
            "<div style=\"margin-bottom:24px;padding:20px 22px;border-radius:18px;"
            "background:linear-gradient(135deg,#ecfeff 0%,#f0fdfa 100%);border:1px solid #99f6e4;\">"
            "<div style=\"font-size:12px;font-weight:700;color:#0f766e;text-transform:uppercase;"
            "letter-spacing:0.08em;margin-bottom:8px;\">Share your feedback</div>"
            "<div style=\"font-size:16px;font-weight:700;color:#134e4a;margin-bottom:6px;\">How was your order?</div>"
            "<div style=\"font-size:14px;color:#115e59;line-height:1.7;\">"
            "Your order was delivered successfully. You can now leave a review for each product "
            "using the review button in the items section above."
            "</div>"
            "</div>"
        )

    cancellation_reason_html = ""
    if order.cancellation_reason:
        cancellation_reason_html = (
            "<div style=\"margin-bottom:16px;padding:16px 18px;border-radius:16px;background:#fff7ed;border:1px solid #fdba74;\">"
            "<div style=\"font-size:12px;font-weight:700;color:#9a3412;text-transform:uppercase;"
            "letter-spacing:0.08em;margin-bottom:6px;\">Cancellation reason</div>"
            f"<div style=\"font-size:14px;color:#7c2d12;line-height:1.7;\">{escape(order.cancellation_reason)}</div>"
            "</div>"
        )

    return_reason_html = ""
    if return_reason:
        return_reason_html = (
            "<div style=\"margin-bottom:16px;padding:16px 18px;border-radius:16px;background:#eff6ff;border:1px solid #93c5fd;\">"
            "<div style=\"font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;"
            "letter-spacing:0.08em;margin-bottom:6px;\">Return reason</div>"
            f"<div style=\"font-size:14px;color:#1e3a8a;line-height:1.7;\">{escape(return_reason)}</div>"
            "</div>"
        )

    notes_html = ""
    if order.notes:
        notes_html = (
            "<div style=\"margin-bottom:16px;padding:16px 18px;border-radius:16px;background:#f8fafc;border:1px solid #e5e7eb;\">"
            "<div style=\"font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;"
            "letter-spacing:0.08em;margin-bottom:6px;\">Notes</div>"
            f"<div style=\"font-size:14px;color:#334155;line-height:1.7;\">{escape(order.notes)}</div>"
            "</div>"
        )

    html_body = f"""
    <html>
      <body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,sans-serif;color:#111827;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eef2ff;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:720px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.12);">
                <tr>
                  <td style="padding:36px 40px;background:linear-gradient(135deg,#0f172a 0%,#111827 55%,#06b6d4 100%);">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <img src="{escape(build_logo_src())}" alt="VorionMart" style="display:block;height:auto;max-width:220px;width:100%;margin:0 0 14px;" />
                          <div style="color:#cbd5e1;font-size:13px;line-height:1.7;font-weight:600;letter-spacing:0.02em;">Powered by Vorion Nexus Technology</div>
                          <h1 style="margin:18px 0 8px;color:#ffffff;font-size:32px;line-height:1.15;font-weight:800;">{escape(subject)}</h1>
                          <p style="margin:0;color:#dbeafe;font-size:15px;line-height:1.7;max-width:520px;">{escape(intro)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:22px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-right:10px;">
                                <span style="display:inline-block;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;{get_status_badge_style(order_status)}">{escape(order_status)}</span>
                              </td>
                              <td>
                                <span style="display:inline-block;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;{get_status_badge_style(payment_status)}">{escape(payment_status)}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 40px 14px;">
                    <p style="margin:0 0 18px;font-size:18px;line-height:1.7;color:#0f172a;">Hi <strong>{escape(customer_name)}</strong>,</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:18px;background:#f8fafc;padding:0 24px;">
                      <tr>
                        <td style="padding:22px 0 6px;font-size:18px;font-weight:800;color:#0f172a;">Order details</td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            {build_detail_row('Order ID', order.order_id)}
                            {build_detail_row('Order status', order_status)}
                            {build_detail_row('Payment status', payment_status)}
                            {build_detail_row('Refund status', refund_status)}
                            {build_detail_row('Total amount', format_currency(order.total_amount), accent=True)}
                            {build_detail_row('Delivery address', delivery_address)}
                          </table>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;background:#ffffff;">
                      <tr>
                        <td style="padding:22px 24px 10px;font-size:18px;font-weight:800;color:#0f172a;background:#f8fafc;border-bottom:1px solid #e5e7eb;">Items in your order</td>
                      </tr>
                      <tr>
                        <td style="padding:0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr style="background:#f8fafc;">
                              <th align="left" style="padding:12px 16px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Product</th>
                              <th align="center" style="padding:12px 16px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Qty</th>
                              <th align="right" style="padding:12px 16px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Amount</th>
                              <th align="right" style="padding:12px 16px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Link</th>
                            </tr>
                            {build_items_html(order)}
                          </table>
                        </td>
                      </tr>
                    </table>
                    {delivered_feedback_html}
                    {cancellation_reason_html}
                    {return_reason_html}
                    {notes_html}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 36px;">
                    <div style="border-top:1px solid #e5e7eb;padding-top:22px;color:#64748b;font-size:13px;line-height:1.8;">
                      Thank you for shopping with <strong style="color:#0f172a;">VorionMart</strong>, a brand by <strong style="color:#0f172a;">Vorion Nexus Technology</strong>.<br>
                      We will continue to send updates as your order progresses.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """

    message = EmailMultiAlternatives(
        subject=subject,
        body='\n'.join(text_lines),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )
    message.mixed_subtype = 'related'
    message.attach_alternative(html_body, 'text/html')
    attach_logo_image(message)

    try:
        message.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send order email for order %s to %s", order.order_id, recipient)


def send_order_created_email(order):
    send_order_email(
        order,
        subject=f"Order Confirmed: {order.order_id}",
        intro="We received your order successfully. Here is your current order summary.",
    )


def send_order_status_email(order):
    status_content = {
        'out_for_delivery': (
            f"Out for Delivery: {order.order_id}",
            "Your order is out for delivery and should reach you soon.",
        ),
        'delivered': (
            f"Delivered: {order.order_id}",
            "Your order has been delivered successfully.",
        ),
        'completed': (
            f"Delivered: {order.order_id}",
            "Your order has been completed successfully.",
        ),
        'cancelled': (
            f"Order Cancelled: {order.order_id}",
            "Your order has been cancelled. Please review the details below.",
        ),
        'returned': (
            f"Order Returned: {order.order_id}",
            "Your order return has been registered successfully.",
        ),
    }
    subject, intro = status_content.get(
        order.status,
        (f"Order Status Update: {order.order_id}", f"Your order status is now {order.get_status_display()}."),
    )

    send_order_email(
        order,
        subject=subject,
        intro=intro,
    )


def send_return_request_email(order):
    send_order_email(
        order,
        subject=f"Return Request Received: {order.order_id}",
        intro="We received your return request. Our team will review it and keep you updated on the refund process.",
    )


def send_payment_status_email(order):
    send_order_email(
        order,
        subject=f"Payment Update: {order.order_id}",
        intro=f"Your payment status is now {order.get_payment_status_display()}.",
    )


def send_refund_status_email(order):
    send_order_email(
        order,
        subject=f"Refund Update: {order.order_id}",
        intro=f"Your refund status is now {order.get_refund_status_display()}.",
    )
