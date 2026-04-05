# Vorionmart Launch Readiness Checklist

Project: `Vorionmart`  
Version: `1.0.0`  
Generated: `2026-04-05`

Practical launch checklist for the Next.js storefront and Django backend. Each item includes an implementation-focused description plus working fields for priority, status, owner, and notes.

## Core Website Setup

- [ ] Production config and environment freeze  
  Description: Verify production API URLs, payment/COD flags, image domains, email sender settings, and secret keys are correct in deployment config with a documented release snapshot.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `Frontend + Backend`  
  Notes: Confirm Next.js public env values against Django settings and document final launch values in ops notes.

- [ ] SSL and mixed content check  
  Description: Run the live site through HTTPS-only navigation and confirm no HTTP assets, insecure scripts, or image warnings appear on homepage, PDP, cart, checkout, and policy pages.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Frontend`  
  Notes: Check CDN image URLs and any hardcoded asset links from older templates.

- [ ] Responsive layout and navigation pass  
  Description: Test header, footer, search, category navigation, cart drawer/page, and checkout layout on mobile, tablet, and desktop breakpoints with real content.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `Frontend QA`  
  Notes: Focus on 360px to 430px widths where ecommerce layouts usually break first.

- [ ] Broken links and fallback page coverage  
  Description: Check all primary nav links, homepage banners, category links, PDP breadcrumbs, cart routes, 404 page, and error boundaries so users never hit a dead end during launch week.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Frontend QA`  
  Notes: Include manual checks for banners, footer links, and empty-state CTAs.

## Product Management

- [ ] Product image quality and consistency  
  Description: Review every launch SKU for sharp primary images, clean background, consistent aspect ratio, zoom-ready resolution, and no supplier watermarks or cropped variants.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `Catalog Team`  
  Notes: Target at least 1200px square exports for main catalog images.

- [x] Required catalog attributes complete  
  Description: Confirm title, slug, category, MRP, selling price, COD eligibility, stock, brand/specs, shipping promise, and return eligibility exist for each listed product.  
  Priority: `High`  
  Status: `Done`  
  Owner: `Catalog Team`  
  Notes: Use admin export to spot blank brand/spec fields before enabling more SKUs.

- [ ] Stock handling and out-of-stock behavior  
  Description: Validate admin stock edits update storefront availability, low-stock items are visible internally, and out-of-stock products cannot be purchased while still showing useful alternatives.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `Admin Ops`  
  Notes: Verify low stock threshold and disable purchase CTA when quantity reaches zero.

- [ ] PDP merchandising and trust content  
  Description: Make sure each product detail page shows price breakdown, COD messaging, delivery estimate, return cue, highlights/specifications, and visible support path near the purchase action.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Frontend + Merchandising`  
  Notes: Audit the top 20 launch SKUs manually because template issues surface there first.

## Checkout and Order Flow

- [ ] Cart, shipping, and order total accuracy  
  Description: Test quantity changes, coupon edge cases, shipping fee rules, and final order totals so cart, checkout, and admin order records match exactly.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `Backend + Frontend`  
  Notes: Reconcile subtotal, shipping, COD fee if any, and final payable amount in both UI and order payload.

- [ ] COD verification and risk control flow  
  Description: Validate COD-eligible order creation, customer verification steps, blocked/soft-block customer rules, and internal handling for suspicious repeat-RTO customers.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Operations`  
  Notes: Define who confirms COD orders and where verification status is tracked before dispatch.

- [x] Order confirmation workflow  
  Description: Confirm successful checkout triggers thank-you page state, admin order entry, confirmation email/SMS/WhatsApp plan, and clear next-step messaging for the customer.  
  Priority: `High`  
  Status: `Done`  
  Owner: `Backend + CRM`  
  Notes: Existing email flow passes tests; still validate live copy and sender identity on production.

- [ ] Checkout validation and error recovery  
  Description: Test invalid phone numbers, partial addresses, unavailable items, network failures, and page refreshes to make sure checkout recovers gracefully without duplicate orders.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `QA`  
  Notes: Include back-button behavior and retry after session expiration.

## SEO Setup

- [ ] Title and meta description templates  
  Description: Set production-ready title and description patterns for homepage, categories, products, cart-safe pages, and policy pages without duplicate or placeholder copy.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `SEO`  
  Notes: Keep product titles readable and capped for search results, not just admin naming.

- [ ] Product schema on PDP  
  Description: Implement and validate structured data with product name, image, price, availability, brand, aggregate rating if real, and offer information on product pages.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Frontend SEO`  
  Notes: Use only real ratings/reviews; do not publish fake aggregate data.

- [x] Sitemap and robots.txt validation  
  Description: Confirm the generated sitemap includes indexable storefront URLs and robots.txt blocks only admin/internal paths while allowing product and category discovery.  
  Priority: `High`  
  Status: `Done`  
  Owner: `Frontend SEO`  
  Notes: Re-submit final sitemap URL in Search Console after launch domain is fixed.

- [ ] Open Graph, Twitter, and canonical tags  
  Description: Check social preview tags and canonical URLs on homepage, category, and product pages so shared links render correctly and duplicates do not fragment ranking signals.  
  Priority: `Medium`  
  Status: `Not Started`  
  Owner: `Frontend SEO`  
  Notes: Use a real product image for PDP previews and a default brand image for collection pages.

## Google Merchant / Free Listings Setup

- [ ] Merchant Center account, domain claim, and business info  
  Description: Verify Merchant Center is created, website is claimed and verified, business details are complete, and shipping/return references point to live policy pages.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Growth`  
  Notes: Use the exact launch domain and match store branding with the site footer/business details.

- [ ] Feed required attributes readiness  
  Description: Ensure feed rows expose stable ID, title, description, link, image_link, availability, price, condition, brand, and shipping details where required for launch SKUs.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Backend + Catalog`  
  Notes: Prepare fallback rules for products missing GTIN/MPN and document the identifier strategy.

- [ ] Merchant shipping, returns, and policy alignment  
  Description: Match Merchant Center shipping speeds, return window, and contact info with the actual customer-facing shipping and return policy pages on Vorionmart.  
  Priority: `High`  
  Status: `Blocked`  
  Owner: `Operations`  
  Notes: Blocked until the final return window and shipping SLA are approved.

- [ ] Feed diagnostics and sample product validation  
  Description: Upload or fetch the feed, inspect diagnostics, and manually verify at least 10 sample SKUs in Merchant Center for landing-page parity and image approval.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Growth + QA`  
  Notes: Include one SKU from each launch category instead of testing only best sellers.

## Legal and Trust

- [x] Shipping and return policy visibility  
  Description: Place shipping and return/refund links in footer, checkout, and PDP trust zones so customers can find policy details before ordering.  
  Priority: `High`  
  Status: `Done`  
  Owner: `Frontend`  
  Notes: Verify policy links are not hidden behind expandable accordions on mobile.

- [ ] Terms, privacy, and COD disclaimer consistency  
  Description: Review terms, privacy, COD disclaimer, and return policy language so billing, cancellation, support, and data-use statements do not contradict each other.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `Founder + Legal`  
  Notes: Specifically align COD cancellation and refusal wording across all policy pages.

- [ ] Support contact visibility  
  Description: Expose at least one verified email and phone/WhatsApp support path in footer, contact page, order confirmation, and return/help journeys.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Support`  
  Notes: Use the same contact details across merchant listings, footer, and transactional templates.

- [ ] Trust messaging near purchase actions  
  Description: Show customer-safe cues like COD availability, secure checkout note, delivery expectations, and return promise adjacent to add-to-cart or checkout CTAs.  
  Priority: `Medium`  
  Status: `In Progress`  
  Owner: `Frontend`  
  Notes: Avoid clutter; keep trust content visible without pushing the buy box below the fold.

## Marketing Readiness

- [ ] Homepage hero and launch offer readiness  
  Description: Confirm banners, homepage hero copy, offer badges, and category highlights match the products and pricing that will actually be live on launch day.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `Growth + Design`  
  Notes: Remove any placeholder sales language that is not backed by live catalog pricing.

- [ ] Campaign landing page and deep-link readiness  
  Description: Validate every marketing URL, UTM-tagged link, and influencer/ads destination leads to a live category, PDP, or launch page with no empty inventory.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Growth`  
  Notes: Create a simple source-of-truth sheet mapping campaign names to live URLs.

- [ ] Coupon, offer, and COD incentive rules  
  Description: Test any launch coupon, free-shipping threshold, bundle, or COD incentive logic so the promise shown in marketing creatives matches checkout behavior.  
  Priority: `Medium`  
  Status: `Blocked`  
  Owner: `Growth + Backend`  
  Notes: Blocked until the final launch discount strategy is approved.

- [ ] Launch creative and support asset pack  
  Description: Prepare approved product images, resized ad creatives, social copy, FAQ snippets, and customer-support macros for the first 72 hours after launch.  
  Priority: `Medium`  
  Status: `In Progress`  
  Owner: `Growth + Support`  
  Notes: Include quick-reply answers for COD, delivery timing, and return eligibility.

## Analytics and Tracking

- [x] GA4 and tag manager installation  
  Description: Verify analytics containers are installed on all storefront routes with the correct production measurement IDs and no duplicate page_view firing.  
  Priority: `High`  
  Status: `Done`  
  Owner: `Growth + Frontend`  
  Notes: Check route transitions in Next.js so page views are not missed on client-side navigation.

- [ ] Core ecommerce event tracking  
  Description: Fire and validate view_item, add_to_cart, begin_checkout, add_shipping_info where applicable, and purchase/order_placed events with usable product and revenue payloads.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Frontend + Backend`  
  Notes: For COD-first flow, ensure purchase/order_placed tracks after order creation, not after payment success.

- [ ] Ads and remarketing pixel validation  
  Description: Check Meta or other ad pixels, remarketing tags, and custom conversions on key pages so paid traffic can be optimized after launch.  
  Priority: `Medium`  
  Status: `Not Started`  
  Owner: `Growth`  
  Notes: Only enable channels that have actual launch budget and consent-compliant usage.

- [ ] Search Console and webmaster verification  
  Description: Verify domain ownership, submit sitemap, and confirm index coverage can be monitored from day one after the public launch.  
  Priority: `Medium`  
  Status: `In Progress`  
  Owner: `SEO`  
  Notes: Track the first crawl errors and soft-404s during the launch week.

## Admin and Operations

- [ ] Admin roles and access review  
  Description: Confirm only required users have access to products, orders, banners, settings, partners, and customer data, with launch-day operators clearly assigned.  
  Priority: `High`  
  Status: `In Progress`  
  Owner: `Admin Lead`  
  Notes: Remove unused test accounts and verify least-privilege access for non-founder users.

- [ ] Admin stock handling workflow  
  Description: Document who updates stock, how fast sell-outs are reflected, how cancelled COD inventory is returned to stock, and what backup process exists if admin updates fail.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Operations`  
  Notes: Create a launch-day stock escalation channel for hot SKUs.

- [ ] Backup and security checks  
  Description: Validate database backup schedule, media backup coverage, admin auth protections, secret management, and incident contact list before public launch.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `Backend + DevOps`  
  Notes: Include restore verification for at least one recent backup, not backup creation alone.

- [ ] Order processing SOP and escalation path  
  Description: Define a practical SOP covering COD verification, packing, dispatch, delayed shipment follow-up, cancellation handling, and return/refund ownership.  
  Priority: `High`  
  Status: `Blocked`  
  Owner: `Operations + Support`  
  Notes: Blocked until shipping partner cutoff times and return SLA are finalized.

## Final QA Testing

- [ ] Cross-device storefront smoke test  
  Description: Run full browse-to-cart-to-order flows on at least one Android phone, one iPhone-sized viewport, one laptop browser, and one low-bandwidth session.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `QA`  
  Notes: Use production-like catalog images and real policy pages during the rehearsal.

- [ ] COD order rehearsal with admin follow-through  
  Description: Place a complete COD test order and verify it reaches admin, triggers confirmation steps, and can be moved through the first fulfillment states without manual patching.  
  Priority: `High`  
  Status: `Not Started`  
  Owner: `QA + Operations`  
  Notes: Use a dedicated test phone/email so communications can be verified end to end.

- [ ] Browser console and performance sanity pass  
  Description: Check for JavaScript errors, failed network requests, oversized images, and severe Core Web Vitals regressions on homepage, categories, PDP, cart, and checkout.  
  Priority: `Medium`  
  Status: `In Progress`  
  Owner: `Frontend`  
  Notes: Prioritize image-heavy PDPs and launch landing pages where LCP risk is highest.

- [ ] Launch-day rollback and support plan  
  Description: Prepare a clear owner list, issue triage channel, rollback trigger, backup contact sheet, and short customer-facing incident response template before going live.  
  Priority: `Medium`  
  Status: `Not Started`  
  Owner: `Founder + Tech Lead`  
  Notes: Keep the rollback decision simple: disable traffic, pause campaigns, and revert the release if checkout or order creation is unstable.
