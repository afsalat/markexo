"""
URL configuration for VorionMart project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
"""
URL configuration for VorionMart project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from api.views import GoogleMerchantFeedView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('google-feed.xml', GoogleMerchantFeedView.as_view(), name='google-merchant-feed-root'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG or getattr(settings, 'SERVE_MEDIA_FILES', False):
    from django.views.static import serve
    from django.utils.cache import patch_cache_control
    from django.urls import re_path

    def cache_served_media(request, path, document_root=None, show_indexes=False):
        response = serve(request, path, document_root, show_indexes)
        if response.status_code == 200:
            patch_cache_control(response, public=True, max_age=2592000, immutable=True)
        return response

    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', cache_served_media, {'document_root': settings.MEDIA_ROOT}),
    ]

