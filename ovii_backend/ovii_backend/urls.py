"""
URL configuration for ovii_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from users import views as user_views


urlpatterns = [
    path('', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/wallets/', include('wallets.urls')),
    path('api/agents/', include('agents.urls')), # This line was missing in my previous response's context
    path('api/merchants/', include('merchants.urls')), # This line was also missing
    path('api/integrations/', include('integrations.urls')),
    # JWT Token Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    

]

# Custom admin URLs
urlpatterns.insert(0, path('admin/dashboard/chart-data/', user_views.dashboard_chart_data, name='admin_chart_data'))

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)