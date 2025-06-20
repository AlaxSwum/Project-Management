from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('debug/registration/', views.debug_user_registration, name='debug-registration'),
] 