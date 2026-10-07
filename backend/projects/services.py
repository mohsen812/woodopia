from django.db import transaction

from organizations.models import Membership

from .models import Project, ProjectAssignment
from .activity_service import create_project_activity



def get_consultant_queue():
    """
    Return projects waiting for a consultant.

    A project is in the consultant queue when:
    - its status is consulting
    - it has no active assignment
    """

    return (
        Project.objects
        .filter(status="consulting")
        .exclude(
            assignments__status="active"
        )
        .distinct()
        .order_by("-created_at")
    )


@transaction.atomic
def send_project_to_consultant(project):
    """
    Move project into consultant queue.
    """

    if project.status != "draft":
        raise ValueError(
            "Only draft projects can be sent to consultant."
        )

    project.status = "consulting"

    project.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    create_project_activity(
        project=project,
        event_type="project.sent_to_consultant",
    )

    return project



@transaction.atomic
def claim_project(project, membership):
    """
    Assign a project to a consultant.

    The membership must belong to an active consultant.
    """

    if membership.status != "active":
        raise ValueError(
            "Consultant membership is not active."
        )

    if not membership.role_fk:
        raise ValueError(
            "Membership has no organization role."
        )

    if membership.role_fk.name != "consultant":
        raise ValueError(
            "Membership is not a consultant."
        )

    if project.status != "consulting":
        raise ValueError(
            "Project is not available for consultant review."
        )

    assignment = (
        ProjectAssignment.objects
        .select_for_update()
        .filter(
            project=project,
            status="active",
        )
        .first()
    )

    if assignment:
        raise ValueError(
            "Project has already been claimed."
        )

    assignment = ProjectAssignment.objects.create(
        project=project,
        membership=membership,
        assigned_by=None,
        status="active",
    )

    create_project_activity(
        project=project,
        event_type="project.consultant_claimed",
        actor=membership.user,
    )

    return assignment


def get_consultant_projects(membership):
    """
    Return projects assigned to a consultant.
    """

    return (
        Project.objects
        .filter(
            assignments__membership=membership,
            assignments__status="active",
        )
        .distinct()
        .order_by("-updated_at")
    )
def get_consultant_dashboard_counts(membership):
    """
    Return dashboard counts for a consultant.
    """

    queue_count = get_consultant_queue().count()

    my_projects_count = (
        Project.objects
        .filter(
            assignments__membership=membership,
            assignments__status="active",
        )
        .distinct()
        .count()
    )

    active_tenders_count = (
        Project.objects
        .filter(
            assignments__membership=membership,
            assignments__status="active",
            tenders__status__in=[
                "open",
                "closed",
                "revealed",
            ],
        )
        .distinct()
        .count()
    )

    return {
        "queue_count": queue_count,
        "my_projects_count": my_projects_count,
        "active_tenders_count": active_tenders_count,
    }

# =====================================
# PROJECT WORKFLOW V1
# =====================================

def get_project_progress(project, user=None):
    """
    Canonical Project Workflow V1.

    This service is the single backend source for project progress.
    It projects authoritative domain state into the 9 UX stages.
    """

    from django.utils import timezone

    from tenders.models import (
        Tender,
        CustomerTenderSelection,
    )

    stages = [
        {
            "key": "creation",
            "label": "ایجاد پروژه",
            "state": "upcoming",
            "icon": "creation",
            "action_required": False,
        },
        {
            "key": "consulting",
            "label": "مشاوره",
            "state": "upcoming",
            "icon": "consulting",
            "action_required": False,
        },
        {
            "key": "standardization",
            "label": "استانداردسازی",
            "state": "upcoming",
            "icon": "standardization",
            "action_required": False,
        },
        {
            "key": "tender",
            "label": "مناقصه",
            "state": "upcoming",
            "icon": "tender",
            "action_required": False,
        },
        {
            "key": "selection_payment",
            "label": "انتخاب / پرداخت",
            "state": "upcoming",
            "icon": "selection_payment",
            "action_required": False,
        },
        {
            "key": "production",
            "label": "تولید",
            "state": "upcoming",
            "icon": "production",
            "action_required": False,
        },
        {
            "key": "quality_control",
            "label": "کنترل کیفیت",
            "state": "upcoming",
            "icon": "quality_control",
            "action_required": False,
        },
        {
            "key": "shipping",
            "label": "ارسال",
            "state": "upcoming",
            "icon": "shipping",
            "action_required": False,
        },
        {
            "key": "delivery",
            "label": "تحویل / تأیید",
            "state": "upcoming",
            "icon": "delivery",
            "action_required": False,
        },
    ]

    next_action = {
        "required": False,
        "title": None,
        "action": None,
    }

    timing = {
        "type": None,
        "label": None,
        "value": None,
    }

    # ---------------------------------
    # Creation
    # ---------------------------------

    if project.status == "draft":
        stages[0]["state"] = "current"

        next_action = {
            "required": True,
            "title": "ارسال پروژه برای مشاوره",
            "action": "send_to_consultant",
        }

        current_stage = "creation"

    else:
        stages[0]["state"] = "completed"

        # ---------------------------------
        # Consulting
        # ---------------------------------

        stages[1]["state"] = "current"
        current_stage = "consulting"

        has_active_assignment = project.assignments.filter(
            status="active"
        ).exists()

        if not has_active_assignment:
            next_action = {
                "required": True,
                "title": "دریافت پروژه برای بررسی",
                "action": "claim_project",
            }

        # ---------------------------------
        # Standardization
        # ---------------------------------

        tender = (
            Tender.objects
            .filter(project=project)
            .order_by("-created_at")
            .first()
        )

        if tender is not None:
            stages[1]["state"] = "completed"
            stages[2]["state"] = "current"
            current_stage = "standardization"

            standardization_status = (
                tender.standardization_status or "draft"
            )

            if standardization_status == "pending_customer":
                stages[2]["state"] = "attention"

                next_action = {
                    "required": True,
                    "title": "بررسی و تأیید استانداردسازی",
                    "action": "review_standardization",
                }

            elif standardization_status == "revision_requested":
                stages[2]["state"] = "attention"

                next_action = {
                    "required": True,
                    "title": "اصلاح استانداردسازی",
                    "action": "revise_standardization",
                }

            elif standardization_status == "approved":
                stages[2]["state"] = "completed"

                # ---------------------------------
                # Tender
                # ---------------------------------

                stages[3]["state"] = "current"
                current_stage = "tender"

                if tender.status == "draft":
                    next_action = {
                        "required": True,
                        "title": "تنظیم و شروع مناقصه",
                        "action": "open_tender",
                    }

                elif tender.status == "open":
                    next_action = {
                        "required": False,
                        "title": "در انتظار پیشنهاد کارگاه‌ها",
                        "action": None,
                    }

                    if tender.deadline:
                        timing = {
                            "type": "deadline",
                            "label": "مهلت ارسال پیشنهاد",
                            "value": tender.deadline.isoformat(),
                        }

                elif tender.status == "closed":
                    next_action = {
                        "required": True,
                        "title": "ارزیابی پیشنهادها",
                        "action": "evaluate_tender",
                    }

                elif tender.status == "revealed":
                    stages[3]["state"] = "completed"

                    # ---------------------------------
                    # Selection / Payment
                    # ---------------------------------

                    selection = (
                        CustomerTenderSelection.objects
                        .filter(tender=tender)
                        .first()
                    )

                    if selection is None:
                        stages[4]["state"] = "current"
                        current_stage = "selection_payment"

                        next_action = {
                            "required": True,
                            "title": "انتخاب پیشنهاد",
                            "action": "select_tender_bid",
                        }

                    elif selection.status in (
                        "selected",
                        "consultant_verified",
                        "identity_revealed",
                    ):
                        stages[4]["state"] = "current"
                        current_stage = "selection_payment"

                        next_action = {
                            "required": True,
                            "title": "تکمیل فرآیند پرداخت",
                            "action": "complete_payment",
                        }

                    elif selection.status == "payment_pending":
                        stages[4]["state"] = "attention"
                        current_stage = "selection_payment"

                        next_action = {
                            "required": True,
                            "title": "تکمیل پرداخت",
                            "action": "complete_payment",
                        }

                    elif selection.status in (
                        "payment_confirmed",
                        "finalized",
                    ):
                        stages[4]["state"] = "completed"

                        # ---------------------------------
                        # Production
                        # ---------------------------------

                        stages[5]["state"] = "current"
                        current_stage = "production"

                    elif selection.status == "cancelled":
                        stages[4]["state"] = "blocked"
                        current_stage = "selection_payment"

                        next_action = {
                            "required": False,
                            "title": "فرآیند انتخاب لغو شده است",
                            "action": None,
                        }

        # ---------------------------------
        # Existing production / QC projection
        # ---------------------------------

        production_items = project.items.filter(
            status="production"
        ).exists()

        completed_items = project.items.filter(
            status="completed"
        ).exists()

        if production_items:
            stages[5]["state"] = "current"
            current_stage = "production"

            next_action = {
                "required": False,
                "title": "در حال تولید",
                "action": None,
            }

        elif completed_items and stages[5]["state"] == "upcoming":
            stages[5]["state"] = "completed"

    # ---------------------------------
    # Mark previous stages completed
    # ---------------------------------

    current_index = next(
        (
            index
            for index, stage in enumerate(stages)
            if stage["state"] in ("current", "attention", "blocked")
        ),
        None,
    )

    if current_index is not None:
        for index in range(current_index):
            if stages[index]["state"] == "upcoming":
                stages[index]["state"] = "completed"

    # ---------------------------------
    # Health
    # ---------------------------------

    health = "on_track"

    if any(stage["state"] == "blocked" for stage in stages):
        health = "blocked"
    elif any(stage["state"] == "attention" for stage in stages):
        health = "delayed"

    return {
        "current_stage": current_stage,
        "stages": stages,
        "next_action": next_action,
        "timing": timing,
        "health": health,
    }
