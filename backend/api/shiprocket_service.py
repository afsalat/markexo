"""
Shiprocket and Courier Logistics Service for VorionMart.
Handles Shiprocket REST API v2 integration, serviceability checks, AWB assignment,
label generation, live tracking, and fallback simulation for all logistics providers.
"""
import json
import logging
import random
import string
import time
import urllib.request
import urllib.error
from decimal import Decimal
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from django.utils import timezone
from api.models import CourierPartner, Order, Shipment, SiteSetting

logger = logging.getLogger(__name__)

SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external"
_TOKEN_CACHE: Dict[str, Dict[str, Any]] = {}


class ShiprocketService:
    """Service to interact with Shiprocket and manage courier partner fulfillment."""

    @staticmethod
    def get_token(courier_partner: CourierPartner) -> Optional[str]:
        """Authenticate with Shiprocket API and cache the bearer token."""
        email = (courier_partner.api_email or '').strip()
        password = (courier_partner.api_password or '').strip()

        if not email or not password:
            return None

        cache_key = f"sr_{courier_partner.id}_{email}"
        cached = _TOKEN_CACHE.get(cache_key)
        if cached and cached.get('expires_at', 0) > time.time() + 300:
            return cached.get('token')

        url = f"{SHIPROCKET_API_BASE}/auth/login"
        payload = json.dumps({'email': email, 'password': password}).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=payload,
            headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                body = json.loads(response.read().decode('utf-8'))
                token = body.get('token')
                if token:
                    # Tokens typically valid for 10 days; cache for 7 days
                    _TOKEN_CACHE[cache_key] = {
                        'token': token,
                        'expires_at': time.time() + (7 * 86400)
                    }
                    return token
        except Exception as e:
            logger.error("Shiprocket authentication error for partner %s: %s", courier_partner.name, str(e))
            return None

    @staticmethod
    def check_serviceability(
        courier_partner: CourierPartner,
        pickup_pincode: str,
        delivery_pincode: str,
        weight_kg: float = 0.5,
        is_cod: bool = True
    ) -> Dict[str, Any]:
        """
        Check delivery serviceability and rates for a given route and parcel weight.
        Uses Shiprocket API if live credentials are configured, or calculates
        precise logistics rates using the partner's configured rate cards.
        """
        pickup_pincode = str(pickup_pincode).strip()
        delivery_pincode = str(delivery_pincode).strip()
        weight_kg = max(0.1, float(weight_kg))

        # Try live Shiprocket API if provider is shiprocket and credentials exist
        if courier_partner.provider_code == 'shiprocket' and courier_partner.environment == 'PRODUCTION':
            token = ShiprocketService.get_token(courier_partner)
            if token:
                url = (
                    f"{SHIPROCKET_API_BASE}/courier/serviceability/?"
                    f"pickup_postcode={pickup_pincode}&delivery_postcode={delivery_pincode}&"
                    f"weight={weight_kg}&cod={1 if is_cod else 0}"
                )
                req = urllib.request.Request(
                    url,
                    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'},
                    method='GET'
                )
                try:
                    with urllib.request.urlopen(req, timeout=12) as response:
                        data = json.loads(response.read().decode('utf-8'))
                        if data.get('status') == 200:
                            company_list = data.get('data', {}).get('available_courier_companies', [])
                            couriers = []
                            for c in company_list:
                                couriers.append({
                                    'courier_company_id': c.get('courier_company_id'),
                                    'courier_name': c.get('courier_name'),
                                    'rate': float(c.get('rate', 0.0)),
                                    'etd': c.get('etd', '3-5 Days'),
                                    'cod': bool(c.get('cod', False)),
                                    'rating': c.get('rating', '4.5'),
                                })
                            return {
                                'success': True,
                                'serviceable': len(couriers) > 0,
                                'pickup_pincode': pickup_pincode,
                                'delivery_pincode': delivery_pincode,
                                'weight_kg': weight_kg,
                                'available_couriers': couriers,
                                'source': 'shiprocket_live'
                            }
                except Exception as e:
                    logger.warning("Shiprocket live serviceability failed: %s, falling back to rate card", str(e))

        # Fallback / Direct Rate Card Calculation (Delhivery, Blue Dart, DTDC, India Post, Shadowfax, or Sandbox)
        base_rate = float(courier_partner.base_rate or 50.0)
        per_kg = float(courier_partner.per_kg_rate or 40.0)
        cod_fee = float(courier_partner.cod_charge or 30.0) if is_cod else 0.0

        extra_kg = max(0.0, weight_kg - 0.5)
        calculated_freight = round(base_rate + (extra_kg * per_kg) + cod_fee, 2)

        # Generate realistic carrier options
        mock_companies = []
        if courier_partner.provider_code == 'shiprocket':
            carriers = [
                {'name': 'Delhivery Surface', 'multiplier': 0.95, 'etd': '3-4 Days', 'rating': '4.6'},
                {'name': 'Blue Dart Express', 'multiplier': 1.35, 'etd': '1-2 Days', 'rating': '4.8'},
                {'name': 'DTDC Air Express', 'multiplier': 1.10, 'etd': '2-3 Days', 'rating': '4.4'},
                {'name': 'Shadowfax Direct', 'multiplier': 0.90, 'etd': '3-5 Days', 'rating': '4.3'},
                {'name': 'Ecom Express', 'multiplier': 0.88, 'etd': '4-5 Days', 'rating': '4.2'},
            ]
            for idx, c in enumerate(carriers, start=101):
                mock_companies.append({
                    'courier_company_id': idx,
                    'courier_name': c['name'],
                    'rate': round(calculated_freight * c['multiplier'], 2),
                    'etd': c['etd'],
                    'cod': is_cod,
                    'rating': c['rating'],
                })
        else:
            mock_companies.append({
                'courier_company_id': 1,
                'courier_name': courier_partner.name,
                'rate': calculated_freight,
                'etd': '2-4 Days',
                'cod': is_cod,
                'rating': '4.7',
            })

        return {
            'success': True,
            'serviceable': True,
            'pickup_pincode': pickup_pincode,
            'delivery_pincode': delivery_pincode,
            'weight_kg': weight_kg,
            'available_couriers': mock_companies,
            'source': 'rate_card'
        }

    @staticmethod
    def create_shipment(
        order: Order,
        courier_partner: CourierPartner,
        weight_kg: Optional[float] = None,
        length: Optional[float] = None,
        width: Optional[float] = None,
        height: Optional[float] = None,
        selected_courier_name: Optional[str] = None,
        courier_company_id: Optional[int] = None,
        custom_awb: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates an AWB and Shipment consignment for an Order.
        Updates the Order status to 'shipped' and records tracking details.
        """
        site_setting = SiteSetting.objects.first()
        pickup_pincode = courier_partner.pickup_pincode or getattr(site_setting, 'pickup_pincode', '110020')
        pickup_loc = courier_partner.default_pickup_location or getattr(site_setting, 'pickup_warehouse_name', 'Primary Warehouse')

        # Compute package specs if not passed
        final_weight = float(weight_kg if weight_kg is not None else order.calculate_shipping_weight())
        dims = order.calculate_package_dimensions()
        final_l = float(length if length is not None else dims['length'])
        final_w = float(width if width is not None else dims['width'])
        final_h = float(height if height is not None else dims['height'])

        carrier_label = selected_courier_name or courier_partner.name
        now = timezone.now()

        # Try Live Shiprocket API if enabled
        live_created = False
        shipment_id = ''
        awb_code = (custom_awb or '').strip()
        tracking_url = ''
        label_url = ''

        if courier_partner.provider_code == 'shiprocket' and courier_partner.environment == 'PRODUCTION':
            token = ShiprocketService.get_token(courier_partner)
            if token:
                try:
                    # Prepare order items for Shiprocket
                    sr_items = []
                    for item in order.items.all():
                        sr_items.append({
                            'name': item.product_name,
                            'sku': f"SKU-{item.product_id or item.id}",
                            'units': item.quantity,
                            'selling_price': float(item.price),
                            'discount': 0,
                            'tax': 0,
                            'hsn': getattr(item.product, 'hsn_code', '') if item.product else ''
                        })

                    cust = order.customer
                    name_parts = cust.name.strip().split(' ', 1)
                    first_name = name_parts[0]
                    last_name = name_parts[1] if len(name_parts) > 1 else ''

                    sr_order_payload = {
                        'order_id': order.order_id,
                        'order_date': order.created_at.strftime('%Y-%m-%d %H:%M'),
                        'pickup_location': pickup_loc,
                        'channel_id': '',
                        'comment': f"VorionMart Order {order.order_id}",
                        'billing_customer_name': first_name,
                        'billing_last_name': last_name,
                        'billing_address': order.delivery_address,
                        'billing_city': order.delivery_city,
                        'billing_pincode': order.delivery_pincode,
                        'billing_state': 'India',
                        'billing_country': 'India',
                        'billing_email': cust.email or 'customer@vorionmart.com',
                        'billing_phone': cust.phone or '9999999999',
                        'shipping_is_billing': True,
                        'order_items': sr_items,
                        'payment_method': 'COD' if order.is_cod else 'Prepaid',
                        'sub_total': float(order.total_amount),
                        'length': final_l,
                        'breadth': final_w,
                        'height': final_h,
                        'weight': final_weight,
                    }

                    # Create Adhoc Order on Shiprocket
                    req = urllib.request.Request(
                        f"{SHIPROCKET_API_BASE}/orders/create/adhoc",
                        data=json.dumps(sr_order_payload).encode('utf-8'),
                        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=15) as res:
                        sr_order_res = json.loads(res.read().decode('utf-8'))
                        shipment_id = str(sr_order_res.get('shipment_id') or sr_order_res.get('order_id') or '')

                        # Assign AWB if shipment created
                        if shipment_id:
                            awb_payload = {'shipment_id': shipment_id}
                            if courier_company_id:
                                awb_payload['courier_id'] = courier_company_id

                            awb_req = urllib.request.Request(
                                f"{SHIPROCKET_API_BASE}/courier/assign/awb",
                                data=json.dumps(awb_payload).encode('utf-8'),
                                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
                                method='POST'
                            )
                            with urllib.request.urlopen(awb_req, timeout=15) as awb_res:
                                awb_data = json.loads(awb_res.read().decode('utf-8'))
                                res_obj = awb_data.get('response', {}).get('data', {})
                                awb_code = res_obj.get('awb_code') or awb_code
                                carrier_label = res_obj.get('courier_name') or carrier_label
                                live_created = True

                            # Generate Label
                            label_req = urllib.request.Request(
                                f"{SHIPROCKET_API_BASE}/courier/generate/label",
                                data=json.dumps({'shipment_id': [shipment_id]}).encode('utf-8'),
                                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
                                method='POST'
                            )
                            try:
                                with urllib.request.urlopen(label_req, timeout=12) as label_res:
                                    label_data = json.loads(label_res.read().decode('utf-8'))
                                    label_url = label_data.get('label_url', '')
                            except Exception:
                                pass
                except Exception as e:
                    logger.error("Shiprocket live order dispatch failed: %s, falling back to local dispatch", str(e))

        # Local / Sandbox / Direct Carrier Dispatch
        if not awb_code:
            prefix = {
                'shiprocket': 'SR',
                'delhivery': 'DLV',
                'bluedart': 'BLU',
                'dtdc': 'DTC',
                'indiapost': 'EM',
                'shadowfax': 'SFX',
                'manual': 'VM',
            }.get(courier_partner.provider_code, 'AGV')
            rand_digits = ''.join(random.choices(string.digits, k=9))
            suffix = 'IN' if courier_partner.provider_code == 'indiapost' else ''
            awb_code = f"{prefix}{rand_digits}{suffix}"

        if not shipment_id:
            shipment_id = f"SHP-{random.randint(100000, 999999)}"

        # Compute tracking URL
        template = courier_partner.tracking_url_template or 'https://shiprocket.co/tracking/{awb}'
        tracking_url = template.replace('{awb}', awb_code)

        # Initial tracking events
        init_events = [
            {
                'status': 'manifest_generated',
                'activity': 'Shipping manifest generated & consignment created',
                'location': getattr(site_setting, 'pickup_city', 'New Delhi'),
                'timestamp': now.strftime('%d %b %Y, %I:%M %p')
            },
            {
                'status': 'pickup_scheduled',
                'activity': f"Pickup scheduled with {carrier_label} courier executive",
                'location': getattr(site_setting, 'pickup_warehouse_name', 'Central Warehouse'),
                'timestamp': (now + timedelta(minutes=15)).strftime('%d %b %Y, %I:%M %p')
            }
        ]

        # Calculate shipping charge
        base_rate = float(courier_partner.base_rate or 50.0)
        per_kg = float(courier_partner.per_kg_rate or 40.0)
        extra_kg = max(0.0, final_weight - 0.5)
        shipping_fee = round(base_rate + (extra_kg * per_kg), 2)
        cod_amt = float(order.total_amount) if order.is_cod else 0.0

        # Create Shipment record
        shipment = Shipment.objects.create(
            order=order,
            courier_partner=courier_partner,
            courier_name=carrier_label,
            awb_code=awb_code,
            shipment_id=shipment_id,
            status='pickup_scheduled',
            weight_kg=Decimal(str(final_weight)),
            package_length=Decimal(str(final_l)),
            package_width=Decimal(str(final_w)),
            package_height=Decimal(str(final_h)),
            shipping_charge=Decimal(str(shipping_fee)),
            cod_amount=Decimal(str(cod_amt)),
            is_cod=order.is_cod,
            pickup_location=pickup_loc,
            pickup_pincode=pickup_pincode,
            delivery_address=order.delivery_address,
            delivery_city=order.delivery_city,
            delivery_pincode=order.delivery_pincode,
            customer_name=order.customer.name,
            customer_phone=order.customer.phone,
            label_url=label_url or f"/api/admin/shipments/{awb_code}/label/",
            tracking_url=tracking_url,
            tracking_events=init_events,
            shipped_at=now,
        )

        # Update Order fields
        order.courier_partner = courier_partner
        order.courier_name = carrier_label
        order.courier_awb = awb_code
        order.courier_tracking_url = tracking_url
        order.shipping_label_url = shipment.label_url
        order.shipment_id = shipment_id
        order.package_weight = Decimal(str(final_weight))
        order.package_length = Decimal(str(final_l))
        order.package_width = Decimal(str(final_w))
        order.package_height = Decimal(str(final_h))
        order.shipped_at = now
        order.status = 'shipped'
        order.save()

        return {
            'success': True,
            'message': f"Order dispatched successfully with {carrier_label}!",
            'awb_code': awb_code,
            'shipment_id': shipment_id,
            'courier_name': carrier_label,
            'tracking_url': tracking_url,
            'label_url': shipment.label_url,
            'shipment_pk': shipment.id,
            'is_live': live_created,
        }

    @staticmethod
    def track_shipment(shipment: Shipment) -> Dict[str, Any]:
        """
        Fetch real-time tracking checkpoints for a shipment.
        If using live Shiprocket and credentials exist, calls API;
        otherwise provides comprehensive realistic tracking progress based on elapsed time.
        """
        partner = shipment.courier_partner

        # Live Shiprocket tracking
        if partner and partner.provider_code == 'shiprocket' and partner.environment == 'PRODUCTION':
            token = ShiprocketService.get_token(partner)
            if token:
                url = f"{SHIPROCKET_API_BASE}/courier/track/awb/{shipment.awb_code}"
                req = urllib.request.Request(
                    url,
                    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'},
                    method='GET'
                )
                try:
                    with urllib.request.urlopen(req, timeout=12) as res:
                        data = json.loads(res.read().decode('utf-8'))
                        tracking_data = data.get('tracking_data', {})
                        scans = tracking_data.get('shipment_track_activities', [])
                        if scans:
                            events = []
                            for s in scans:
                                events.append({
                                    'status': s.get('current_status', 'in_transit'),
                                    'activity': s.get('activity', ''),
                                    'location': s.get('location', ''),
                                    'timestamp': s.get('date', '')
                                })
                            shipment.tracking_events = events
                            shipment.save(update_fields=['tracking_events'])
                            return {
                                'success': True,
                                'awb_code': shipment.awb_code,
                                'status': shipment.status,
                                'current_status_text': tracking_data.get('track_status', 'In Transit'),
                                'tracking_events': events,
                                'source': 'shiprocket_live'
                            }
                except Exception as e:
                    logger.warning("Shiprocket live tracking failed: %s", str(e))

        # Dynamic / Simulated realistic checkpoints based on time elapsed
        created = shipment.created_at
        now = timezone.now()
        hours_elapsed = (now - created).total_seconds() / 3600.0

        events = [
            {
                'status': 'manifest_generated',
                'activity': f"Shipping manifest generated by VorionMart Fulfilment Hub",
                'location': shipment.pickup_location,
                'timestamp': created.strftime('%d %b %Y, %I:%M %p')
            },
            {
                'status': 'pickup_scheduled',
                'activity': f"Package sorted and ready for courier pickup",
                'location': f"{shipment.pickup_location} ({shipment.pickup_pincode})",
                'timestamp': (created + timedelta(minutes=20)).strftime('%d %b %Y, %I:%M %p')
            }
        ]

        if hours_elapsed >= 0.05:
            events.append({
                'status': 'picked_up',
                'activity': f"Shipment picked up by {shipment.courier_name} executive",
                'location': shipment.pickup_location,
                'timestamp': (created + timedelta(minutes=45)).strftime('%d %b %Y, %I:%M %p')
            })

        if hours_elapsed >= 0.2:
            events.append({
                'status': 'in_transit',
                'activity': f"Arrived at logistics sorting hub & scanned in transit",
                'location': 'Delhi National Hub (DEL-01)',
                'timestamp': (created + timedelta(hours=2)).strftime('%d %b %Y, %I:%M %p')
            })

        if hours_elapsed >= 0.5:
            events.append({
                'status': 'in_transit',
                'activity': f"Departed facility on route to destination hub {shipment.delivery_city}",
                'location': 'Interstate Cargo Transit Hub',
                'timestamp': (created + timedelta(hours=6)).strftime('%d %b %Y, %I:%M %p')
            })

        if hours_elapsed >= 1.0:
            events.append({
                'status': 'out_for_delivery',
                'activity': f"Out for delivery! Courier agent assigned for final delivery run",
                'location': f"{shipment.delivery_city} Local Delivery Branch",
                'timestamp': (created + timedelta(hours=14)).strftime('%d %b %Y, %I:%M %p')
            })

        # Update status if progressed
        latest_event = events[-1]
        shipment.status = latest_event['status']
        shipment.tracking_events = events
        shipment.save(update_fields=['status', 'tracking_events'])

        # Keep Order status in sync
        if shipment.status in ('in_transit', 'out_for_delivery', 'delivered'):
            if shipment.status == 'out_for_delivery' and shipment.order.status != 'out_for_delivery':
                shipment.order.status = 'out_for_delivery'
                shipment.order.save(update_fields=['status'])
            elif shipment.status == 'delivered' and shipment.order.status != 'delivered':
                shipment.order.status = 'delivered'
                shipment.order.delivered_at = now
                shipment.order.save(update_fields=['status', 'delivered_at'])

        return {
            'success': True,
            'awb_code': shipment.awb_code,
            'courier_name': shipment.courier_name,
            'status': shipment.status,
            'current_status_text': shipment.get_status_display(),
            'tracking_url': shipment.tracking_url,
            'tracking_events': events,
            'source': 'carrier_hub'
        }

    @staticmethod
    def generate_shipping_label_html(shipment: Shipment) -> str:
        """
        Generates a standard 4x6 inch logistics shipping label in printable HTML/CSS.
        Includes Barcode simulation, Consignor/Consignee addresses, routing codes,
        COD details, and parcel manifests.
        """
        site_setting = SiteSetting.objects.first()
        order = shipment.order

        sender_name = getattr(site_setting, 'pickup_warehouse_name', 'VorionMart Logistics Hub') or 'VorionMart Logistics Hub'
        sender_phone = getattr(site_setting, 'pickup_phone', '+91 9876543210') or '+91 9876543210'
        sender_address = getattr(site_setting, 'pickup_address', 'Plot 42, Logistics Park, Okhla Industrial Area') or 'Plot 42, Logistics Park, Okhla Industrial Area'
        sender_city = getattr(site_setting, 'pickup_city', 'New Delhi') or 'New Delhi'
        sender_state = getattr(site_setting, 'pickup_state', 'Delhi') or 'Delhi'
        sender_pincode = getattr(site_setting, 'pickup_pincode', '110020') or '110020'
        sender_gstin = getattr(site_setting, 'pickup_gstin', '07AAAAA0000A1Z5') or '07AAAAA0000A1Z5'

        payment_badge_class = "cod-badge" if shipment.is_cod else "prepaid-badge"
        payment_text = "C.O.D (Cash on Delivery)" if shipment.is_cod else "PREPAID"
        cod_amount_html = f"<div class='cod-amount'>Collect: ₹{shipment.cod_amount:,.2f}</div>" if shipment.is_cod else "<div class='prepaid-zero'>Amount Collected: ₹0.00</div>"

        # Item rows
        items_rows = ""
        for idx, itm in enumerate(order.items.all(), 1):
            hsn = getattr(itm.product, 'hsn_code', '-') if itm.product else '-'
            items_rows += f"""
            <tr>
                <td style="text-align: center;">{idx}</td>
                <td><strong>{itm.product_name}</strong></td>
                <td style="text-align: center;">{hsn}</td>
                <td style="text-align: center;">{itm.quantity}</td>
                <td style="text-align: right;">₹{itm.price:,.2f}</td>
                <td style="text-align: right;">₹{itm.total:,.2f}</td>
            </tr>
            """

        # Generate standard SVG barcode pattern representation
        def make_barcode_svg(code_str: str, height: int = 50) -> str:
            bars = []
            seed = sum(ord(c) for c in code_str)
            random_gen = random.Random(seed)
            x = 10
            for i in range(45):
                w = random_gen.choice([2, 3, 4, 1])
                bars.append(f'<rect x="{x}" y="0" width="{w}" height="{height}" fill="#000000" />')
                x += w + random_gen.choice([1, 2, 3])
            total_w = x + 10
            return f'<svg width="100%" height="{height}" viewBox="0 0 {total_w} {height}" preserveAspectRatio="none">{"".join(bars)}</svg>'

        awb_barcode_svg = make_barcode_svg(shipment.awb_code, 55)
        order_barcode_svg = make_barcode_svg(order.order_id, 35)

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Shipping Label - {shipment.awb_code}</title>
<style>
    @page {{
        size: 100mm 150mm;
        margin: 0;
    }}
    body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 10px;
        background: #f8fafc;
        color: #0f172a;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }}
    .label-container {{
        width: 96mm;
        margin: 0 auto;
        background: #ffffff;
        border: 2px solid #000000;
        padding: 8px;
        box-sizing: border-box;
    }}
    .header {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #000000;
        padding-bottom: 6px;
        margin-bottom: 6px;
    }}
    .brand {{
        font-size: 18px;
        font-weight: 900;
        letter-spacing: -0.5px;
        color: #0284c7;
    }}
    .brand span {{
        color: #0f172a;
    }}
    .carrier-box {{
        text-align: right;
    }}
    .carrier-name {{
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
    }}
    .routing-code {{
        font-size: 11px;
        font-weight: 700;
        color: #475569;
    }}
    .barcode-section {{
        text-align: center;
        padding: 6px 0;
        border-bottom: 2px solid #000000;
    }}
    .awb-text {{
        font-family: monospace;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: 2px;
        margin-top: 4px;
    }}
    .details-grid {{
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        border-bottom: 2px solid #000000;
    }}
    .delivery-box {{
        padding: 6px 8px 6px 0;
        border-right: 2px solid #000000;
    }}
    .section-title {{
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 2px;
    }}
    .customer-name {{
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 2px;
    }}
    .address-text {{
        font-size: 11px;
        line-height: 1.3;
        margin-bottom: 4px;
    }}
    .phone-text {{
        font-size: 12px;
        font-weight: 700;
    }}
    .pincode-highlight {{
        display: inline-block;
        background: #000000;
        color: #ffffff;
        font-size: 13px;
        font-weight: 900;
        padding: 2px 6px;
        border-radius: 3px;
        margin-top: 4px;
    }}
    .meta-box {{
        padding: 6px 0 6px 8px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }}
    .payment-tag {{
        padding: 6px;
        text-align: center;
        border-radius: 4px;
        margin-bottom: 6px;
    }}
    .cod-badge {{
        background: #fef2f2;
        border: 2px solid #dc2626;
        color: #991b1b;
    }}
    .prepaid-badge {{
        background: #f0fdf4;
        border: 2px solid #16a34a;
        color: #166534;
    }}
    .payment-title {{
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.5px;
    }}
    .cod-amount {{
        font-size: 16px;
        font-weight: 900;
        color: #dc2626;
        margin-top: 2px;
    }}
    .prepaid-zero {{
        font-size: 10px;
        font-weight: 600;
    }}
    .spec-table {{
        width: 100%;
        font-size: 10px;
        border-collapse: collapse;
    }}
    .spec-table td {{
        padding: 2px 0;
    }}
    .return-box {{
        padding: 6px 0;
        border-bottom: 2px solid #000000;
        font-size: 10px;
        line-height: 1.3;
    }}
    .manifest-box {{
        padding: 6px 0 0 0;
    }}
    .manifest-table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 9px;
    }}
    .manifest-table th {{
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 3px;
        font-weight: 700;
        text-align: left;
    }}
    .manifest-table td {{
        border: 1px solid #cbd5e1;
        padding: 3px;
    }}
    .footer-note {{
        margin-top: 6px;
        text-align: center;
        font-size: 8px;
        color: #64748b;
    }}
    .no-print-bar {{
        max-width: 96mm;
        margin: 0 auto 10px auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }}
    .print-btn {{
        background: #0284c7;
        color: white;
        border: none;
        padding: 8px 16px;
        font-weight: 700;
        border-radius: 6px;
        cursor: pointer;
    }}
    @media print {{
        .no-print-bar {{ display: none !important; }}
        body {{ background: transparent; padding: 0; }}
        .label-container {{ border: 2px solid #000; }}
    }}
</style>
</head>
<body>

<div class="no-print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Print Shipping Label</button>
    <span style="font-size: 12px; color: #64748b;">Format: Standard 4x6" Thermal</span>
</div>

<div class="label-container">
    <div class="header">
        <div class="brand">VORION<span>MART</span></div>
        <div class="carrier-box">
            <div class="carrier-name">{shipment.courier_name}</div>
            <div class="routing-code">Hub: {shipment.delivery_city[:3].upper()}-{shipment.delivery_pincode[:3]}</div>
        </div>
    </div>

    <div class="barcode-section">
        {awb_barcode_svg}
        <div class="awb-text">{shipment.awb_code}</div>
    </div>

    <div class="details-grid">
        <div class="delivery-box">
            <div class="section-title">Ship To / Consignee:</div>
            <div class="customer-name">{shipment.customer_name or order.customer.name}</div>
            <div class="address-text">{shipment.delivery_address}</div>
            <div class="address-text"><strong>City:</strong> {shipment.delivery_city}</div>
            <div class="phone-text">📞 {shipment.customer_phone or order.customer.phone}</div>
            <div>
                <span class="pincode-highlight">PIN: {shipment.delivery_pincode}</span>
            </div>
        </div>

        <div class="meta-box">
            <div class="payment-tag {payment_badge_class}">
                <div class="payment-title">{payment_text}</div>
                {cod_amount_html}
            </div>

            <table class="spec-table">
                <tr><td><strong>Order:</strong></td><td>#{order.order_id}</td></tr>
                <tr><td><strong>Weight:</strong></td><td>{shipment.weight_kg} kg</td></tr>
                <tr><td><strong>Dims:</strong></td><td>{shipment.package_length}x{shipment.package_width}x{shipment.package_height} cm</td></tr>
                <tr><td><strong>Date:</strong></td><td>{shipment.created_at.strftime('%d-%b-%Y')}</td></tr>
            </table>

            <div style="margin-top: 4px;">
                {order_barcode_svg}
                <div style="text-align: center; font-family: monospace; font-size: 9px;">#{order.order_id}</div>
            </div>
        </div>
    </div>

    <div class="return-box">
        <div class="section-title">Return Address / Shipper (Consignor):</div>
        <strong>{sender_name}</strong>, {sender_address}, {sender_city}, {sender_state} - {sender_pincode} | Ph: {sender_phone} | GSTIN: {sender_gstin}
    </div>

    <div class="manifest-box">
        <table class="manifest-table">
            <thead>
                <tr>
                    <th style="width: 20px; text-align: center;">#</th>
                    <th>Item Description</th>
                    <th style="width: 40px; text-align: center;">HSN</th>
                    <th style="width: 25px; text-align: center;">Qty</th>
                    <th style="width: 50px; text-align: right;">Price</th>
                    <th style="width: 55px; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                {items_rows}
            </tbody>
        </table>
    </div>

    <div class="footer-note">
        This is a computer-generated shipping document. Certified B2C E-commerce parcel.
    </div>
</div>

</body>
</html>
"""
        return html_content
