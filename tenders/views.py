from django.db.models import Q
from django.db import transaction
from django.utils import timezone


from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from organizations.models import (
    Organization,
    Membership,
)

from django.shortcuts import get_object_or_404

from projects.models import Project

from evaluation.services import evaluate_tender
from evaluation.reports import build_tender_report

from projects.views import get_visible_projects

from .visibility import tender_is_revealed
from .services import (
    award_tender,
    select_tender_bid,
)

from .models import (
    Tender,
    TenderParticipant,
    TenderRound,
    PaymentSchedule,
    Bid,
    BidItem,
    ConsultantSpecification,
    SpecificationAttachment,
)

from .serializers import (
    TenderSerializer,
    TenderParticipantSerializer,
    BidSerializer,
    TenderRoundCreateSerializer,
    BidItemSerializer,
    PaymentScheduleSerializer,
    TenderAwardCreateSerializer,
    TenderAwardSerializer,
    TenderSelectBidSerializer,
    ConsultantSpecificationSerializer,
    SpecificationAttachmentSerializer,


)

class TenderListCreateView(
    generics.ListCreateAPIView
):

    queryset = (
        Tender.objects
        .all()
        .order_by("-created_at")
    )

    serializer_class = TenderSerializer


class TenderDetailView(
    generics.RetrieveAPIView
):

    queryset = Tender.objects.all()

    serializer_class = TenderSerializer


# =====================================
# TENDER CONTROL ACCESS
# =====================================

class TenderControlAccessMixin:

    def get_tender(self):

        tender_id = self.kwargs["pk"]

        user = self.request.user

        if user.is_superuser or user.is_staff:

            return get_object_or_404(
                Tender.objects.select_related("project"),
                id=tender_id,
            )

        return get_object_or_404(
            Tender.objects.filter(
                Q(
                    project__assignments__membership__user=user,
                    project__assignments__membership__status="active",
                    project__assignments__membership__role_fk__name="consultant",
                    project__assignments__status="active",
                )
            ).distinct(),
            id=tender_id,
        )

# =====================================
# TENDER SETTINGS
# =====================================

class TenderSettingsView(
    TenderControlAccessMixin,
    generics.GenericAPIView
):

    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):

        tender = self.get_tender()

        if tender.status != "draft":
            raise ValidationError(
                "تنظیمات مناقصه فقط در مرحله پیش‌نویس امکان‌پذیر است."
            )

        scheduled_start_at = request.data.get(
            "scheduled_start_at",
            tender.scheduled_start_at,
        )

        scheduled_end_at = request.data.get(
            "scheduled_end_at",
            tender.scheduled_end_at,
        )

        deadline = request.data.get(
            "deadline",
            tender.deadline,
        )

        round_count = request.data.get(
            "round_count",
            tender.round_count,
        )

        serializer = TenderSerializer(
            tender,
            data={
                "scheduled_start_at": scheduled_start_at,
                "scheduled_end_at": scheduled_end_at,
                "deadline": deadline,
                "round_count": round_count,
            },
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data

        start_at = validated.get(
            "scheduled_start_at",
            tender.scheduled_start_at,
        )

        end_at = validated.get(
            "scheduled_end_at",
            tender.scheduled_end_at,
        )

        deadline_value = validated.get(
            "deadline",
            tender.deadline,
        )

        round_count_value = validated.get(
            "round_count",
            tender.round_count,
        )

        if start_at and end_at and start_at >= end_at:
            raise ValidationError({
                "scheduled_end_at":
                    "زمان پایان باید بعد از زمان شروع باشد."
            })

        if start_at and deadline_value:
            if deadline_value < start_at:
                raise ValidationError({
                    "deadline":
                        "مهلت ارسال پیشنهاد نمی‌تواند قبل از شروع مناقصه باشد."
                })

        if deadline_value and end_at:
            if deadline_value > end_at:
                raise ValidationError({
                    "deadline":
                        "مهلت ارسال پیشنهاد نمی‌تواند بعد از پایان مناقصه باشد."
                })

        if round_count_value is None or int(round_count_value) < 1:
            raise ValidationError({
                "round_count":
                    "تعداد دور مناقصه باید حداقل ۱ باشد."
            })

        tender.scheduled_start_at = start_at
        tender.scheduled_end_at = end_at
        tender.deadline = deadline_value
        tender.round_count = int(round_count_value)

        tender.save(
            update_fields=[
                "scheduled_start_at",
                "scheduled_end_at",
                "deadline",
                "round_count",
                "updated_at",
            ]
        )

        return Response({
            "status": "ok",
            "message": "تنظیمات مناقصه با موفقیت ذخیره شد.",
            "tender": TenderSerializer(tender).data,
        })

# =====================================
# START TENDER
# =====================================

class TenderStartView(
    TenderControlAccessMixin,
    generics.GenericAPIView,
):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request, pk):

        with transaction.atomic():

            tender = (
                Tender.objects
                .select_for_update()
                .select_related("project")
                .get(id=pk)
            )

            # ---------------------------------
            # ACCESS CHECK
            # ---------------------------------

            controlled_tender = self.get_tender()

            if controlled_tender.id != tender.id:
                raise ValidationError(
                    "شما دسترسی کنترل این مناقصه را ندارید."
                )

            # ---------------------------------
            # STATUS CHECK
            # ---------------------------------

            if tender.status != "draft":

                raise ValidationError(
                    "فقط مناقصه در وضعیت پیش‌نویس قابل شروع است."
                )

            # ---------------------------------
            # STANDARDIZATION CHECK
            # ---------------------------------

            if tender.standardization_status != "approved":

                raise ValidationError(
                    "استانداردسازی هنوز توسط مشتری تأیید نشده است."
                )

            # ---------------------------------
            # PARTICIPANT CHECK
            # ---------------------------------

            participant_count = (
                TenderParticipant.objects
                .filter(tender=tender)
                .count()
            )

            if participant_count == 0:

                raise ValidationError(
                    "حداقل یک کارگاه باید برای مناقصه انتخاب شده باشد."
                )

            # ---------------------------------
            # ROUND 1
            # ---------------------------------

            active_round = (
                TenderRound.objects
                .filter(
                    tender=tender,
                    status="open",
                )
                .first()
            )

            if active_round:

                raise ValidationError(
                    "این مناقصه در حال حاضر یک دور فعال دارد."
                )

            round_one = (
                TenderRound.objects
                .filter(
                    tender=tender,
                    round_number=1,
                )
                .first()
            )

            if not round_one:

                round_one = TenderRound.objects.create(
                    tender=tender,
                    round_number=1,
                    status="open",
                    started_at=timezone.now(),
                )

            else:

                if round_one.status != "draft":

                    raise ValidationError(
                        "دور اول مناقصه قابل شروع مجدد نیست."
                    )

                round_one.status = "open"
                round_one.started_at = timezone.now()
                round_one.closed_at = None

                round_one.save(
                    update_fields=[
                        "status",
                        "started_at",
                        "closed_at",
                    ]
                )

            # ---------------------------------
            # OPEN TENDER
            # ---------------------------------

            tender.status = "open"

            tender.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        return Response({
            "status": "open",
            "message": "مناقصه با موفقیت شروع شد.",
            "tender": TenderSerializer(tender).data,
            "active_round_id": round_one.id,
        })


# =====================================
# CLOSE TENDER
# =====================================

class TenderCloseView(
    TenderControlAccessMixin,
    generics.GenericAPIView,
):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request, pk):

        with transaction.atomic():

            tender = (
                Tender.objects
                .select_for_update()
                .select_related("project")
                .get(id=pk)
            )

            # ---------------------------------
            # ACCESS CHECK
            # ---------------------------------

            controlled_tender = self.get_tender()

            if controlled_tender.id != tender.id:
                raise ValidationError(
                    "شما دسترسی کنترل این مناقصه را ندارید."
                )

            # ---------------------------------
            # STATUS CHECK
            # ---------------------------------

            if tender.status != "open":

                raise ValidationError(
                    "فقط مناقصه فعال قابل پایان دادن است."
                )

            now = timezone.now()

            # ---------------------------------
            # CLOSE ACTIVE ROUND
            # ---------------------------------

            active_round = (
                TenderRound.objects
                .filter(
                    tender=tender,
                    status="open",
                )
                .order_by("-round_number")
                .first()
            )

            if active_round:

                active_round.status = "closed"
                active_round.closed_at = now

                active_round.save(
                    update_fields=[
                        "status",
                        "closed_at",
                    ]
                )

            # ---------------------------------
            # CLOSE TENDER
            # ---------------------------------

            tender.status = "closed"
            tender.closed_at = now

            tender.save(
                update_fields=[
                    "status",
                    "closed_at",
                    "updated_at",
                ]
            )

        return Response({
            "status": "closed",
            "message": "مناقصه با موفقیت پایان یافت.",
            "tender": TenderSerializer(tender).data,
        })


            
class TenderParticipantListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = TenderParticipantSerializer
    permission_classes = [IsAuthenticated]

    def get_tender(self):

        tender_id = self.kwargs["tender_id"]
        user = self.request.user

        if user.is_superuser or user.is_staff:
            return get_object_or_404(
                Tender.objects.select_related("project"),
                id=tender_id,
            )

        return get_object_or_404(
            Tender.objects.filter(
                Q(
                    project__assignments__membership__user=user,
                    project__assignments__membership__status="active",
                    project__assignments__membership__role_fk__name="consultant",
                    project__assignments__status="active",
                )
            ).distinct(),
            id=tender_id,
        )

    def get_queryset(self):

        tender = self.get_tender()

        return (
            TenderParticipant.objects
            .filter(tender=tender)
            .select_related(
                "tender",
                "organization",
            )
            .order_by("organization__name", "id")
        )

    def create(self, request, *args, **kwargs):

        tender = self.get_tender()

        if tender.status != "draft":
            raise ValidationError(
                "انتخاب کارگاه‌ها فقط در مرحله پیش‌نویس مناقصه امکان‌پذیر است."
            )

        organizations = request.data.get("organizations")

        if organizations is None:
            return super().create(
                request,
                *args,
                **kwargs
            )

        if not isinstance(organizations, list):
            raise ValidationError({
                "organizations": "باید یک لیست از شناسه کارگاه‌ها ارسال شود."
            })

        try:
            organization_ids = [
                int(organization_id)
                for organization_id in organizations
            ]
        except (TypeError, ValueError):
            raise ValidationError({
                "organizations": "شناسه کارگاه‌ها باید عددی باشند."
            })

        organization_ids = list(
            dict.fromkeys(organization_ids)
        )

        workshops = list(
            Organization.objects.filter(
                id__in=organization_ids,
                organization_type="workshop",
                status="active",
            )
        )

        found_ids = {
            workshop.id
            for workshop in workshops
        }

        invalid_ids = [
            organization_id
            for organization_id in organization_ids
            if organization_id not in found_ids
        ]

        if invalid_ids:
            raise ValidationError({
                "organizations": (
                    "یک یا چند کارگاه انتخاب‌شده معتبر یا فعال نیستند."
                )
            })

        with transaction.atomic():

            TenderParticipant.objects.filter(
                tender=tender
            ).delete()

            TenderParticipant.objects.bulk_create([
                TenderParticipant(
                    tender=tender,
                    organization=workshop,
                )
                for workshop in workshops
            ])

        participants = (
            TenderParticipant.objects
            .filter(tender=tender)
            .select_related(
                "tender",
                "organization",
            )
            .order_by("organization__name", "id")
        )

        return Response({
            "status": "ok",
            "message": "کارگاه‌های مناقصه با موفقیت به‌روزرسانی شدند.",
            "tender_id": tender.id,
            "participant_count": participants.count(),
            "participants": TenderParticipantSerializer(
                participants,
                many=True,
            ).data,
        })

class TenderParticipantResponseView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request, pk):

        participant = get_object_or_404(
            TenderParticipant,
            id=pk,
        )

        response_status = request.data.get(
            "response_status"
        )

        if response_status not in [
            "accepted",
            "declined",
        ]:
            raise ValidationError(
                "وضعیت پاسخ معتبر نیست."
            )


        participant.response_status = response_status
        participant.responded_at = timezone.now()

        participant.save(
            update_fields=[
                "response_status",
                "responded_at",
            ]
        )


        bid_id = None


        if response_status == "accepted":

            active_round = (
                TenderRound.objects
                .filter(
                    tender=participant.tender,
                    status="open",
                )
                .first()
            )


            if active_round:

                bid, created = (
                    Bid.objects
                    .get_or_create(
                        tender_round=active_round,
                        workshop=participant.organization,
                        defaults={
                            "status": "draft",
                        }
                    )
                )

                bid_id = bid.id


        return Response(
            {
                "status": "ok",
                "participant_id": participant.id,
                "response_status": participant.response_status,
                "bid_id": bid_id,
            }
        )
class TenderRoundListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = TenderRoundCreateSerializer

    def get_queryset(self):

        tender_id = self.kwargs["tender_id"]

        return (
            TenderRound.objects
            .filter(tender_id=tender_id)
            .order_by("round_number")
        )

    def perform_create(self, serializer):

        tender_id = self.kwargs["tender_id"]

        tender = Tender.objects.get(
            id=tender_id
        )

        serializer.save(
            tender=tender
        )

class ConsultantSpecificationListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = ConsultantSpecificationSerializer


    def get_queryset(self):

        tender_id = self.kwargs["tender_id"]

        return (
            ConsultantSpecification.objects
            .filter(
                tender_id=tender_id
            )
            .order_by(
                "row_number"
            )
        )


    def perform_create(
        self,
        serializer
    ):

        tender_id = self.kwargs["tender_id"]

        tender = Tender.objects.get(
            id=tender_id
        )

        last_row = (
            ConsultantSpecification.objects
            .filter(
                tender=tender
            )
            .order_by(
                "-row_number"
            )
            .first()
        )


        next_row = 1

        if last_row:
            next_row = last_row.row_number + 1


        serializer.save(
            tender=tender,
            row_number=next_row,
        )
class SpecificationAttachmentListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = SpecificationAttachmentSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_specification(self):

        specification = get_object_or_404(
            ConsultantSpecification.objects.select_related(
                "tender__project"
            ),
            id=self.kwargs["specification_id"],
        )

        user = self.request.user

        if user.is_superuser or user.is_staff:
            return specification

        project_access = Project.objects.filter(
            id=specification.tender.project_id
        ).filter(
            Q(
                assignments__membership__user=user,
                assignments__membership__status="active",
                assignments__status="active",
            )
            |
            Q(
                customer__members__user=user,
                customer__members__status="active",
            )
        ).exists()


        if project_access:
            return specification
        if consultant_project:
            return specification

        raise NotFound(
            "Specification not found."
        )

    def get_queryset(self):

        specification = self.get_specification()

        return (
            SpecificationAttachment.objects
            .filter(
                specification=specification
            )
            .select_related(
                "uploaded_by"
            )
            .order_by(
                "created_at"
            )
        )

    def perform_create(self, serializer):

        specification = self.get_specification()

        serializer.save(
            specification=specification,
            uploaded_by=self.request.user,
        )


class SpecificationAttachmentDeleteView(
    generics.DestroyAPIView
):

    serializer_class = SpecificationAttachmentSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_specification(self):

        specification = get_object_or_404(
            ConsultantSpecification.objects.select_related(
                "tender__project"
            ),
            id=self.kwargs["specification_id"],
        )

        user = self.request.user

        if user.is_superuser or user.is_staff:
            return specification

        project_access = Project.objects.filter(
            id=specification.tender.project_id
        ).filter(
            Q(
                assignments__membership__user=user,
                assignments__membership__status="active",
                assignments__status="active",
            )
            |
            Q(
                customer__members__user=user,
                customer__members__status="active",
            )
        ).exists()


        if project_access:
            return specification

        if consultant_project:
            return specification

        raise NotFound(
            "Specification not found."
        )

    def get_queryset(self):

        specification = self.get_specification()

        return (
            SpecificationAttachment.objects
            .filter(
                specification=specification
            )
        )
class BidCreateView(
    generics.CreateAPIView
):

    queryset = Bid.objects.all()

    serializer_class = BidSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def perform_create(
        self,
        serializer
    ):

        tender_round = serializer.validated_data[
            "tender_round"
        ]

        workshop = serializer.validated_data[
            "workshop"
        ]

        tender = tender_round.tender

        # ------------------------------------------
        # TENDER MUST BE OPEN
        # ------------------------------------------

        if tender.status != "open":

            raise ValidationError(
                "ثبت پیشنهاد فقط در زمان فعال بودن مناقصه امکان‌پذیر است."
            )


        # ------------------------------------------
        # ROUND MUST BE OPEN
        # ------------------------------------------

        if tender_round.status != "open":

            raise ValidationError(
                "ثبت پیشنهاد فقط در دور فعال مناقصه امکان‌پذیر است."
            )


        # ------------------------------------------
        # CURRENT USER MUST BELONG TO THIS WORKSHOP
        # ------------------------------------------

        membership_exists = (
            Membership.objects.filter(
                user=self.request.user,
                organization=workshop,
                status="active",
            )
            .exists()
        )

        if not membership_exists:

            raise ValidationError(
                "شما عضو فعال این کارگاه نیستید."
            )


        # ------------------------------------------
        # WORKSHOP MUST BE A TENDER PARTICIPANT
        # ------------------------------------------

        participant_exists = (
            TenderParticipant.objects.filter(
                tender=tender,
                organization=workshop,
            )
            .exists()
        )

        if not participant_exists:

            raise ValidationError(
                "این کارگاه در این مناقصه شرکت داده نشده است."
            )


        # ------------------------------------------
        # DEADLINE
        # ------------------------------------------

        if (
            tender.deadline
            and timezone.now() > tender.deadline
        ):

            raise ValidationError(
                "مهلت ارسال پیشنهاد به پایان رسیده است."
            )


        # ------------------------------------------
        # ONE BID PER WORKSHOP / ROUND
        # ------------------------------------------

        existing_bid = (
            Bid.objects.filter(
                tender_round=tender_round,
                workshop=workshop,
            )
            .exists()
        )

        if existing_bid:

            raise ValidationError(
                "این کارگاه قبلاً برای این دور پیشنهاد ارسال کرده است."
            )


        serializer.save()
class BidDetailView(
    generics.RetrieveAPIView
):

    queryset = (
        Bid.objects
        .prefetch_related(
            "items",
            "payment_schedules",
        )
        .all()
    )

    serializer_class = BidSerializer
class BidSubmitView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request, pk):

        bid = get_object_or_404(
            Bid,
            id=pk,
        )

        # workshop ownership check

        membership_exists = (
            Membership.objects
            .filter(
                user=request.user,
                organization=bid.workshop,
                status="active",
            )
            .exists()
        )

        if not membership_exists:
            raise ValidationError(
                "شما عضو فعال این کارگاه نیستید."
            )


        if bid.status != "draft":

            raise ValidationError(
                "این پیشنهاد قبلاً ارسال شده یا قابل ارسال نیست."
            )


        if not bid.items.exists():

            raise ValidationError(
                "حداقل یک آیتم قیمت باید ثبت شود."
            )


        bid.status = "submitted"

        bid.save(
            update_fields=[
                "status",
            ]
        )


        return Response(
            {
                "status": "ok",
                "bid_id": bid.id,
                "bid_status": bid.status,
            }
        )    
class BidDiscountUpdateView(
    generics.GenericAPIView
):

    queryset = Bid.objects.all()

    permission_classes = [
        IsAuthenticated
    ]

    def patch(
        self,
        request,
        pk
    ):

        bid = get_object_or_404(
            Bid,
            id=pk
        )


        discount_percentage = request.data.get(
            "discount_percentage"
        )


        if discount_percentage is None:

            raise ValidationError(
                {
                    "discount_percentage":
                    "Discount percentage is required."
                }
            )


        try:

            discount_percentage = float(
                discount_percentage
            )

        except:

            raise ValidationError(
                {
                    "discount_percentage":
                    "Invalid value."
                }
            )


        if discount_percentage < 0 or discount_percentage > 100:

            raise ValidationError(
                {
                    "discount_percentage":
                    "Discount must be between 0 and 100."
                }
            )


        bid.discount_percentage = (
            discount_percentage
        )


        bid.calculate_final_amount()


        bid.save(
            update_fields=[
                "discount_percentage",
                "discount_amount",
                "final_amount",
            ]
        )


        return Response(
            {
                "bid_id": bid.id,
                "total_amount": bid.total_amount,
                "discount_percentage": bid.discount_percentage,
                "discount_amount": bid.discount_amount,
                "final_amount": bid.final_amount,
            }
        )    
class BidItemCreateView(
    generics.CreateAPIView
):

    queryset = BidItem.objects.all()

    serializer_class = BidItemSerializer


    def perform_create(self, serializer):

        bid_id = self.kwargs["bid_id"]

        bid = Bid.objects.get(
            id=bid_id
        )

        serializer.save(
            bid=bid
        )
class TenderEvaluationView(
    generics.GenericAPIView
):

    queryset = Tender.objects.all()

    def get(self, request, pk):

        result = evaluate_tender(pk)

        return Response(result)
class TenderReportView(
    generics.GenericAPIView
):

    queryset = Tender.objects.all()

    def get(self, request, pk):

        tender = self.get_object()

        if not tender_is_revealed(tender):
            return Response(
                {
                    "status": "locked",
                    "message": "Tender results are not revealed yet."
                },
                status=403
            )

        report = build_tender_report(
            pk
        )

        return Response(report)
class PaymentScheduleListCreateView(generics.ListCreateAPIView):

    serializer_class = PaymentScheduleSerializer

    def get_queryset(self):

        bid_id = self.kwargs.get("bid_id")

        return PaymentSchedule.objects.filter(
            bid_id=bid_id
        )


    def perform_create(self, serializer):

        bid_id = self.kwargs.get("bid_id")

        bid = Bid.objects.get(
            id=bid_id
        )

        last_stage = bid.payment_schedules.order_by(
            "-stage_order"
        ).first()

        next_stage = 1

        if last_stage:
            next_stage = last_stage.stage_order + 1

        percentage = serializer.validated_data["percentage"]

        amount = (
            bid.total_amount * percentage / 100
        )

        serializer.save(
            bid=bid,
            stage_order=next_stage,
            amount=amount,
        )
class TenderBidListView(
    generics.ListAPIView
):

    serializer_class = BidSerializer

    def get_queryset(self):

        from .visibility import get_visible_bids

        tender_id = self.kwargs.get(
            "tender_id"
        )

        tender = Tender.objects.get(
            id=tender_id
        )

        viewer_type = self.request.query_params.get(
            "viewer_type"
        )

        return get_visible_bids(
            tender,
            viewer_type,
        )
class TenderSelectBidView(
    generics.GenericAPIView
):

    queryset = Tender.objects.all()

    serializer_class = TenderSelectBidSerializer

    def post(
        self,
        request,
        tender_id
    ):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        bid_id = serializer.validated_data[
            "bid_id"
        ]

        try:

            selection = select_tender_bid(
                tender_id=tender_id,
                bid_id=bid_id,
                user=request.user,
            )

        except ValueError as e:

            return Response(
                {
                    "error": str(e)
                },
                status=400
            )

        return Response(
            {
                "message":
                    "Tender bid selected successfully.",

                "selection_id":
                    selection.id,

                "tender_id":
                    selection.tender_id,

                "bid_id":
                    selection.bid_id,

                "status":
                    selection.status,

                "selected_workshop":
                    (
                        selection.bid.workshop.name
                        if selection.bid.workshop
                        else None
                    ),

                "selected_by":
                    selection.selected_by_id,

                "selected_at":
                    selection.selected_at,
            },
            status=201
        )
class TenderAwardView(
    generics.GenericAPIView
):

    queryset = Tender.objects.all()

    serializer_class = TenderAwardCreateSerializer


    def post(self, request, pk):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        bid_id = serializer.validated_data["bid_id"]


        try:

            award = award_tender(
                tender_id=pk,
                bid_id=bid_id,
                user=request.user,
            )

        except ValueError as e:

            return Response(
                {
                    "error": str(e)
                },
                status=400
            )


        return Response(
            TenderAwardSerializer(award).data,
            status=201
        )
