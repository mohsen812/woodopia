from pathlib import Path

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse


@login_required
def customer_page(request):
    customer_index = (
        Path(settings.BASE_DIR)
        / "frontend"
        / "customer"
        / "index.html"
    )

    return HttpResponse(
        customer_index.read_text(encoding="utf-8")
    )