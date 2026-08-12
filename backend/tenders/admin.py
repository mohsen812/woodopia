from django.contrib import admin
from .models import Tender, TenderParticipant, Bid


@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'project_item',
        'status',
        'deadline',
    )


@admin.register(TenderParticipant)
class TenderParticipantAdmin(admin.ModelAdmin):
    list_display = (
        'tender',
        'organization',
        'invited_at',
    )


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = (
        'tender',
        'workshop',
        'amount',
        'created_at',
    )
