import os
from .settings import *

SECRET_KEY = os.environ["FEEMAAS_SECRET_KEY"]
DEBUG = False

ALLOWED_HOSTS = [x.strip() for x in os.environ.get("FEEMAAS_ALLOWED_HOSTS", "").split(",") if x.strip()]
CSRF_TRUSTED_ORIGINS = [x.strip() for x in os.environ.get("FEEMAAS_CSRF_TRUSTED_ORIGINS", "").split(",") if x.strip()]

DATABASES = {"default": {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": os.environ["FEEMAAS_DB_NAME"],
    "USER": os.environ["FEEMAAS_DB_USER"],
    "PASSWORD": os.environ["FEEMAAS_DB_PASSWORD"],
    "HOST": os.environ["FEEMAAS_DB_HOST"],
    "PORT": os.environ.get("FEEMAAS_DB_PORT", "5432"),
    "CONN_MAX_AGE": 60,
}}

STATIC_URL = "/static/"
STATIC_ROOT = os.environ.get("FEEMAAS_STATIC_ROOT", str(BASE_DIR.parent / "staticfiles"))
MEDIA_URL = "/media/"
MEDIA_ROOT = os.environ.get("FEEMAAS_MEDIA_ROOT", "/app/media")

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [x.strip() for x in os.environ.get("FEEMAAS_CORS_ALLOWED_ORIGINS", "").split(",") if x.strip()]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.environ.get("FEEMAAS_SECURE_SSL_REDIRECT", "true").lower() == "true"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
