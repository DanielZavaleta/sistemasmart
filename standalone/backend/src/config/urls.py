from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Conecta todas las URLs de 'api.urls' bajo el prefijo 'api/'
    path('api/', include('api.urls')), 
]