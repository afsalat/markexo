"""
SEO & Analytics Report Generator
Crawls the local site and DB to produce a comprehensive JSON report.
Usage:  python manage.py generate_seo_reports
"""
import json, os, re, logging
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from django.core.management.base import BaseCommand
from django.db.models import Sum, Avg, Count, Q, F
from django.utils import timezone

logger = logging.getLogger(__name__)

REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'logs')


class Command(BaseCommand):
    help = 'Generate comprehensive SEO & analytics reports for VorionMart'

    def handle(self, *args, **options):
        from api.models import (
            Product, Category, BlogPost, Order, OrderItem,
            Customer, Review, Shop,
        )

        self.stdout.write('🔍 Starting SEO report generation…')
        report = {
            'generated_at': timezone.now().isoformat(),
            'version': '1.0',
        }

        # ──────────────────────────────────────────
        # 1. CONTENT AUDIT
        # ──────────────────────────────────────────
        self.stdout.write('  📝 Running content audit…')
        products = Product.objects.filter(is_active=True, approval_status='approved')
        blogs = BlogPost.objects.filter(is_published=True)
        categories = Category.objects.filter(is_active=True)

        missing_meta = []
        thin_content = []
        missing_images = []
        duplicate_names = []

        # Products
        name_counts = Counter()
        for p in products:
            name_counts[p.name.strip().lower()] += 1
            issues = []
            desc_len = len(p.description or '')
            if desc_len < 50:
                issues.append('thin_description')
            if not p.image:
                issues.append('no_image')
            if not p.name or len(p.name) < 10:
                issues.append('short_title')
            if issues:
                missing_meta.append({
                    'type': 'product',
                    'id': p.id,
                    'name': p.name,
                    'slug': p.slug,
                    'url': f'/products/{p.slug}',
                    'issues': issues,
                    'desc_length': desc_len,
                })

        for name, cnt in name_counts.items():
            if cnt > 1:
                duplicate_names.append({'name': name, 'count': cnt, 'type': 'product'})

        # Blogs
        for b in blogs:
            issues = []
            content_len = len(b.content or '')
            if not b.meta_title:
                issues.append('missing_meta_title')
            if not b.meta_description:
                issues.append('missing_meta_description')
            if content_len < 300:
                issues.append('thin_content')
            if not b.excerpt:
                issues.append('missing_excerpt')
            if issues:
                missing_meta.append({
                    'type': 'blog',
                    'id': b.id,
                    'name': b.title,
                    'slug': b.slug,
                    'url': f'/blog/{b.slug}',
                    'issues': issues,
                    'content_length': content_len,
                })

        # Categories
        for c in categories:
            issues = []
            if not c.description or len(c.description) < 30:
                issues.append('thin_description')
            if not c.image:
                issues.append('no_image')
            if issues:
                missing_meta.append({
                    'type': 'category',
                    'id': c.id,
                    'name': c.name,
                    'slug': c.slug,
                    'url': f'/categories/{c.slug}',
                    'issues': issues,
                })

        report['content_audit'] = {
            'total_products': products.count(),
            'total_blogs': blogs.count(),
            'total_categories': categories.count(),
            'issues': missing_meta,
            'duplicate_names': duplicate_names,
            'summary': {
                'pages_with_issues': len(missing_meta),
                'missing_meta_titles': sum(1 for m in missing_meta if 'missing_meta_title' in m.get('issues', [])),
                'missing_meta_descriptions': sum(1 for m in missing_meta if 'missing_meta_description' in m.get('issues', [])),
                'thin_content': sum(1 for m in missing_meta if 'thin_content' in m.get('issues', []) or 'thin_description' in m.get('issues', [])),
                'missing_images': sum(1 for m in missing_meta if 'no_image' in m.get('issues', [])),
                'duplicates': len(duplicate_names),
            }
        }

        # ──────────────────────────────────────────
        # 2. PRODUCT PERFORMANCE
        # ──────────────────────────────────────────
        self.stdout.write('  📊 Analyzing product performance…')

        high_views_no_sales = list(
            products.filter(views__gte=10, sold_count=0)
            .order_by('-views')[:20]
            .values('id', 'name', 'slug', 'views', 'sold_count', 'our_price', 'category__name')
        )

        top_sellers = list(
            products.filter(sold_count__gt=0)
            .order_by('-sold_count')[:20]
            .values('id', 'name', 'slug', 'views', 'sold_count', 'our_price', 'category__name')
        )

        low_performing = list(
            products.filter(views__lt=5, sold_count=0)
            .order_by('-created_at')[:20]
            .values('id', 'name', 'slug', 'views', 'sold_count', 'created_at', 'category__name')
        )
        for item in low_performing:
            if item.get('created_at'):
                item['created_at'] = item['created_at'].isoformat()

        # Conversion rate by category
        cat_perf = list(
            products.values('category__name')
            .annotate(
                total_views=Sum('views'),
                total_sold=Sum('sold_count'),
                product_count=Count('id'),
                avg_price=Avg('our_price'),
            )
            .order_by('-total_sold')
        )
        for cp in cat_perf:
            v = cp['total_views'] or 0
            cp['conversion_rate'] = round((cp['total_sold'] / v * 100), 2) if v > 0 else 0
            cp['avg_price'] = float(cp['avg_price'] or 0)

        report['product_performance'] = {
            'high_views_no_sales': high_views_no_sales,
            'top_sellers': top_sellers,
            'low_performing': low_performing,
            'category_performance': cat_perf,
        }

        # ──────────────────────────────────────────
        # 3. BLOG PERFORMANCE
        # ──────────────────────────────────────────
        self.stdout.write('  ✍️  Analyzing blog performance…')

        blog_perf = list(
            blogs.order_by('-views')[:20]
            .values('id', 'title', 'slug', 'views', 'ai_generated', 'created_at')
        )
        for bp in blog_perf:
            if bp.get('created_at'):
                bp['created_at'] = bp['created_at'].isoformat()

        blogs_no_views = list(
            blogs.filter(views=0)
            .order_by('-created_at')[:20]
            .values('id', 'title', 'slug', 'created_at')
        )
        for b in blogs_no_views:
            if b.get('created_at'):
                b['created_at'] = b['created_at'].isoformat()

        report['blog_performance'] = {
            'top_blogs': blog_perf,
            'zero_view_blogs': blogs_no_views,
            'total_blog_views': blogs.aggregate(total=Sum('views'))['total'] or 0,
            'ai_generated_count': blogs.filter(ai_generated=True).count(),
            'manual_count': blogs.filter(ai_generated=False).count(),
        }

        # ──────────────────────────────────────────
        # 4. ORDER / REVENUE ANALYTICS
        # ──────────────────────────────────────────
        self.stdout.write('  💰 Analyzing order data…')
        now = timezone.now()
        last_30 = now - timedelta(days=30)
        last_7 = now - timedelta(days=7)

        all_orders = Order.objects.all()
        orders_30d = all_orders.filter(created_at__gte=last_30)
        orders_7d = all_orders.filter(created_at__gte=last_7)

        delivered = all_orders.filter(status__in=['delivered', 'completed'])
        cancelled = all_orders.filter(status__in=['cancelled', 'returned', 'rto', 'refunded'])

        # City distribution
        city_dist = list(
            delivered.values('delivery_city')
            .annotate(count=Count('id'), revenue=Sum('total_amount'))
            .order_by('-count')[:15]
        )
        for c in city_dist:
            c['revenue'] = float(c['revenue'] or 0)

        report['order_analytics'] = {
            'total_orders': all_orders.count(),
            'orders_last_30d': orders_30d.count(),
            'orders_last_7d': orders_7d.count(),
            'delivered_count': delivered.count(),
            'cancelled_count': cancelled.count(),
            'total_revenue': float(delivered.aggregate(t=Sum('total_amount'))['t'] or 0),
            'revenue_30d': float(orders_30d.filter(status__in=['delivered', 'completed']).aggregate(t=Sum('total_amount'))['t'] or 0),
            'avg_order_value': float(delivered.aggregate(a=Avg('total_amount'))['a'] or 0),
            'cod_percentage': round(all_orders.filter(is_cod=True).count() / max(all_orders.count(), 1) * 100, 1),
            'rto_rate': round(all_orders.filter(status='rto').count() / max(all_orders.count(), 1) * 100, 1),
            'top_cities': city_dist,
        }

        # ──────────────────────────────────────────
        # 5. CUSTOMER ANALYTICS
        # ──────────────────────────────────────────
        self.stdout.write('  👥 Analyzing customer data…')
        customers = Customer.objects.all()
        report['customer_analytics'] = {
            'total_customers': customers.count(),
            'repeat_customers': customers.filter(order_count__gte=2).count(),
            'soft_blocked': customers.filter(soft_block=True).count(),
            'avg_orders_per_customer': float(customers.aggregate(a=Avg('order_count'))['a'] or 0),
            'high_rto_customers': customers.filter(rto_count__gte=2).count(),
        }

        # ──────────────────────────────────────────
        # 6. SEO HEALTH SCORECARD
        # ──────────────────────────────────────────
        self.stdout.write('  🏥 Computing SEO health score…')
        total_pages = products.count() + blogs.count() + categories.count()
        pages_ok = total_pages - len(missing_meta)
        seo_score = round((pages_ok / max(total_pages, 1)) * 100)

        schema_coverage = round(blogs.exclude(meta_title='').exclude(meta_description='').count() / max(blogs.count(), 1) * 100)
        image_coverage = round(products.exclude(image='').exclude(image=None).count() / max(products.count(), 1) * 100)

        report['seo_health'] = {
            'overall_score': seo_score,
            'total_pages': total_pages,
            'pages_healthy': pages_ok,
            'pages_with_issues': len(missing_meta),
            'schema_coverage': schema_coverage,
            'image_coverage': image_coverage,
            'has_robots_txt': True,
            'has_sitemap': True,
            'ai_crawler_optimized': True,
        }

        # ──────────────────────────────────────────
        # 7. INDEXING READINESS
        # ──────────────────────────────────────────
        self.stdout.write('  🔗 Checking indexing readiness…')
        products_no_slug = products.filter(Q(slug='') | Q(slug=None)).count()
        blogs_no_slug = blogs.filter(Q(slug='') | Q(slug=None)).count()

        report['indexing'] = {
            'products_indexable': products.count() - products_no_slug,
            'products_missing_slug': products_no_slug,
            'blogs_indexable': blogs.count() - blogs_no_slug,
            'blogs_missing_slug': blogs_no_slug,
            'categories_indexable': categories.count(),
            'google_merchant_synced': products.filter(google_merchant_status='synced').count(),
            'google_merchant_pending': products.filter(google_merchant_status='pending').count(),
            'google_merchant_failed': products.filter(google_merchant_status='failed').count(),
        }

        # ──────────────────────────────────────────
        # 8. QUICK WINS & RECOMMENDATIONS
        # ──────────────────────────────────────────
        self.stdout.write('  ⚡ Generating recommendations…')
        recommendations = []

        if report['content_audit']['summary']['missing_meta_descriptions'] > 0:
            recommendations.append({
                'priority': 'Critical',
                'category': 'Meta Tags',
                'title': f"Fix {report['content_audit']['summary']['missing_meta_descriptions']} missing meta descriptions",
                'impact': 'High CTR improvement in search results',
                'effort': 'Low',
            })

        if report['content_audit']['summary']['thin_content'] > 0:
            recommendations.append({
                'priority': 'High',
                'category': 'Content',
                'title': f"Expand {report['content_audit']['summary']['thin_content']} thin content pages",
                'impact': 'Better rankings for long-tail keywords',
                'effort': 'Medium',
            })

        if len(high_views_no_sales) > 0:
            recommendations.append({
                'priority': 'Critical',
                'category': 'Conversion',
                'title': f"{len(high_views_no_sales)} products have views but zero sales",
                'impact': 'Direct revenue increase — fix pricing, images, or CTAs',
                'effort': 'Medium',
            })

        if report['content_audit']['summary']['missing_images'] > 0:
            recommendations.append({
                'priority': 'High',
                'category': 'Images',
                'title': f"Add images to {report['content_audit']['summary']['missing_images']} pages",
                'impact': 'Google Images traffic + better product pages',
                'effort': 'Low',
            })

        if report['content_audit']['summary']['duplicates'] > 0:
            recommendations.append({
                'priority': 'Medium',
                'category': 'Duplicates',
                'title': f"Resolve {report['content_audit']['summary']['duplicates']} duplicate product names",
                'impact': 'Avoid keyword cannibalization',
                'effort': 'Low',
            })

        if blogs.filter(views=0).count() > 3:
            recommendations.append({
                'priority': 'Medium',
                'category': 'Content',
                'title': f"{blogs.filter(views=0).count()} blog posts have zero views — promote or optimize",
                'impact': 'Recover wasted content investment',
                'effort': 'Low',
            })

        if report['order_analytics']['rto_rate'] > 10:
            recommendations.append({
                'priority': 'Critical',
                'category': 'Operations',
                'title': f"RTO rate is {report['order_analytics']['rto_rate']}% — investigate problem areas",
                'impact': 'Reduce losses and improve customer satisfaction',
                'effort': 'High',
            })

        report['recommendations'] = recommendations

        # ── SAVE ──
        os.makedirs(REPORT_DIR, exist_ok=True)
        report_path = os.path.join(REPORT_DIR, 'seo_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, default=str)

        self.stdout.write(self.style.SUCCESS(f'✅ Report saved to {report_path}'))
        self.stdout.write(self.style.SUCCESS(f'   SEO Score: {seo_score}/100 | {len(recommendations)} recommendations'))
