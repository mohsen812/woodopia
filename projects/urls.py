from django.urls import path

from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    ProjectVisualListCreateView,
    ProjectVisualDetailView,
    ProjectTenderView,
    ProjectTenderSelectWinnerView,
    ProjectAttachmentListCreateView,
    SendProjectToConsultantView,
    ConsultantDashboardView,
    ConsultantQueueView,
    ConsultantClaimView,
    ConsultantMyProjectsView,
    ConsultantStandardizationView,
    CustomerStandardizationView,
    SendStandardizationToCustomerView,    
    CustomerSpecificationReviewView,
    CustomerStandardizationReviewView,
   


)


urlpatterns = [

    path(
        "",
        ProjectListCreateView.as_view(),
        name="project-list",
    ),

    # =====================================
    # CONSULTANT QUEUE
    # =====================================
    path(
        "consultant/dashboard/",
        ConsultantDashboardView.as_view(),
        name="consultant-dashboard",
    ),
    path(
        "consultant/queue/",
        ConsultantQueueView.as_view(),
        name="consultant-queue",
    ),
    path(
        "consultant/my-projects/",
        ConsultantMyProjectsView.as_view(),
        name="consultant-my-projects",
    ),
    # =====================================
    # CONSULTANT CLAIM
    # =====================================

    path(
        "<int:pk>/consultant/claim/",
        ConsultantClaimView.as_view(),
        name="consultant-claim",
    ),
    # =====================================
    # CONSULTANT STANDARDIZATION
    # =====================================

    path(
        "<int:pk>/standardization/",
        ConsultantStandardizationView.as_view(),
        name="consultant-standardization",
    ),
    # =====================================
    # CUSTOMER STANDARDIZATION
    # =====================================

    path(
        "<int:pk>/standardization/view/",
        CustomerStandardizationView.as_view(),
        name="customer-standardization-view",
    ),
    path(
        "<int:pk>/standardization/send/",
        SendStandardizationToCustomerView.as_view(),
        name="send-standardization-to-customer",
    ),
    path(
        "<int:pk>/standardization/review/",
        CustomerStandardizationReviewView.as_view(),
        name="customer-standardization-review",
    ),

  
    # =====================================
    # PROJECT TENDER
    # =====================================

    path(
        "<int:pk>/tender/",
        ProjectTenderView.as_view(),
        name="project-tender",
    ),

    path(
        "<int:pk>/tender/select/",
        ProjectTenderSelectWinnerView.as_view(),
        name="project-tender-select-winner",
    ),

    path(
        "<int:pk>/send-to-consultant/",
        SendProjectToConsultantView.as_view(),
        name="project-send-consultant",
    ),
    # =====================================
    # PROJECT DETAIL
    # =====================================

    path(
        "<int:pk>/",
        ProjectDetailView.as_view(),
        name="project-detail",
    ),

    # =====================================
    # PROJECT VISUALS
    # =====================================

    path(
        "visuals/",
        ProjectVisualListCreateView.as_view(),
        name="visual-list",
    ),

    path(
        "visuals/<int:pk>/",
        ProjectVisualDetailView.as_view(),
        name="visual-detail",
    ),

    # =====================================
    # PROJECT ATTACHMENTS
    # =====================================

    path(
        "<int:pk>/attachments/",
        ProjectAttachmentListCreateView.as_view(),
        name="project-attachment-create",
    ),

    path(
    "<int:pk>/standardization/review/",
    CustomerSpecificationReviewView.as_view(),
    name="customer-standardization-review",
    ),

]
