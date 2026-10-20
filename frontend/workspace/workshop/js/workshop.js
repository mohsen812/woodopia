(function () {

    "use strict";


    /*
    ==================================================
    FEEMAAS WORKSHOP WORKSPACE
    ==================================================
    */

    const API_BASE = "/api/tenders";


    window.WorkshopApp = {

        API_BASE: API_BASE,

        invitations: [],

        currentProject: null,

        currentTender: null,

        init: function () {

            this.bindNavigation();

            this.bindSectionButtons();

            this.bindModalEvents();

            this.loadInvitations();

        },


        bindNavigation: function () {

            const buttons =
                document.querySelectorAll(
                    "[data-workshop-section]"
                );


            buttons.forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const section =
                            button.dataset.workshopSection;

                        this.showSection(section);

                    }
                );

            });

        },


        bindSectionButtons: function () {

            document
                .querySelectorAll(
                    "[data-workshop-section-button]"
                )
                .forEach((button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            this.showSection(
                                button.dataset.workshopSectionButton
                            );

                        }
                    );

                });

        },


        showSection: function (section) {

            document
                .querySelectorAll(
                    ".workshop-nav-item"
                )
                .forEach((item) => {

                    item.classList.toggle(
                        "active",
                        item.dataset.workshopSection === section
                    );

                });


            document
                .querySelectorAll(
                    ".workshop-section"
                )
                .forEach((item) => {

                    item.classList.toggle(
                        "active",
                        item.dataset.workshopContent === section
                    );

                });


            const titles = {

                dashboard: "داشبورد کارگاه",
                projects: "پروژه‌ها",
                tenders: "مناقصه‌ها",
                contracts: "قراردادها",
                payments: "پرداخت‌ها",
                files: "فایل‌ها",
                settings: "تنظیمات"

            };


            const title =
                document.getElementById(
                    "workshop-page-title"
                );


            if (title) {

                title.textContent =
                    titles[section] || "کارگاه";

            }


            if (
                section === "tenders" &&
                window.WorkshopTender
            ) {

                WorkshopTender.renderInvitations(
                    this.invitations
                );

            }

        },


        loadInvitations: async function () {

            const dashboard =
                document.getElementById(
                    "dashboard-invitations"
                );


            try {

                const response =
                    await fetch(
                        `${API_BASE}/workshop/invitations/`,
                        {
                            credentials: "same-origin",
                            headers: {
                                "Accept": "application/json"
                            }
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}`
                    );

                }


                const data =
                    await response.json();


                this.invitations =
                    Array.isArray(data)
                        ? data
                        : (
                            data.results || []
                        );


                this.renderProjects(this.invitations);


                const count =
                    document.getElementById(
                        "dashboard-invitation-count"
                    );


                if (count) {

                    count.textContent =
                        this.invitations.length;

                }


                if (window.WorkshopTender) {

                    WorkshopTender.renderDashboard(
                        this.invitations
                    );

                    WorkshopTender.renderInvitations(
                        this.invitations
                    );

                }

            }
            catch (error) {

                console.error(
                    "Workshop invitations error:",
                    error
                );


                if (dashboard) {

                    dashboard.innerHTML =
                        `
                        <div class="empty-state">
                            دریافت دعوت‌های مناقصه انجام نشد.
                        </div>
                        `;

                }

            }

        },


        renderProjects: function (invitations) {

            const container = document.getElementById(
                "workshop-project-list"
            );

            if (!container) {
                return;
            }

            const uniqueProjects = [];
            const seenProjectIds = new Set();

            (Array.isArray(invitations) ? invitations : []).forEach(
                function (invitation) {

                    const projectId = invitation.project_id;

                    if (
                        projectId === null ||
                        projectId === undefined ||
                        projectId === ""
                    ) {
                        return;
                    }

                    const key = String(projectId);

                    if (seenProjectIds.has(key)) {
                        return;
                    }

                    seenProjectIds.add(key);
                    uniqueProjects.push(invitation);
                }
            );

            container.textContent = "";

            if (!uniqueProjects.length) {
                const empty = document.createElement("div");
                empty.className = "empty-state";
                empty.textContent =
                    "پروژه‌ای برای نمایش وجود ندارد.";
                container.appendChild(empty);
                return;
            }

            const makeElement = function (
                tag,
                className,
                text
            ) {
                const element = document.createElement(tag);

                if (className) {
                    element.className = className;
                }

                if (text !== undefined && text !== null) {
                    element.textContent = String(text);
                }

                return element;
            };

            const statusLabels = {
                pending: "در انتظار پاسخ",
                invited: "دعوت‌شده",
                accepted: "دعوت پذیرفته‌شده",
                declined: "دعوت ردشده",
                rejected: "دعوت ردشده"
            };

            uniqueProjects.forEach((invitation) => {

                const projectId = invitation.project_id;
                const title =
                    invitation.project_title ||
                    invitation.title ||
                    "پروژه بدون عنوان";

                const responseStatus = String(
                    invitation.response_status || "pending"
                ).toLowerCase();

                const statusLabel =
                    statusLabels[responseStatus] ||
                    "وضعیت دعوت";

                const progress = invitation.project_progress || {};
                const stages = Array.isArray(progress.stages)
                    ? progress.stages
                    : [];

                let currentStage = progress.current_stage;
                let currentStageKey = currentStage;
                let currentStageLabel = "";

                if (
                    currentStage &&
                    typeof currentStage === "object"
                ) {
                    currentStageKey =
                        currentStage.key || currentStage.stage || "";
                    currentStageLabel =
                        currentStage.label || "";
                }

                let stageIndex = stages.findIndex(
                    (stage) =>
                        stage &&
                        (
                            stage.key === currentStageKey ||
                            stage.key === currentStage
                        )
                );

                if (stageIndex < 0) {
                    stageIndex = stages.findIndex(
                        (stage) =>
                            stage &&
                            (
                                stage.state === "current" ||
                                stage.state === "active" ||
                                stage.state === "in_progress"
                            )
                    );
                }

                if (!currentStageLabel && stageIndex >= 0) {
                    currentStageLabel =
                        stages[stageIndex].label || "";
                }

                let percent = 0;

                if (stages.length > 1 && stageIndex >= 0) {
                    percent = Math.round(
                        stageIndex / (stages.length - 1) * 100
                    );
                }

                const card = makeElement(
                    "button",
                    "workshop-project-card"
                );

                card.type = "button";
                card.setAttribute(
                    "aria-label",
                    "مشاهده پروژه: " + title
                );
                card.dataset.projectId = String(projectId);

                const top = makeElement(
                    "div",
                    "workshop-project-card-top"
                );

                top.appendChild(
                    makeElement(
                        "span",
                        "workshop-project-number",
                        "پروژه " + projectId
                    )
                );

                top.appendChild(
                    makeElement(
                        "span",
                        "workshop-project-status workshop-project-status-" +
                            responseStatus.replace(/[^a-z0-9_-]/g, ""),
                        statusLabel
                    )
                );

                card.appendChild(top);

                card.appendChild(
                    makeElement(
                        "h3",
                        "workshop-project-title",
                        title
                    )
                );

                if (invitation.tender_title) {
                    card.appendChild(
                        makeElement(
                            "p",
                            "workshop-project-tender",
                            "مناقصه: " + invitation.tender_title
                        )
                    );
                }

                const progressHeader = makeElement(
                    "div",
                    "workshop-project-progress-header"
                );

                progressHeader.appendChild(
                    makeElement(
                        "span",
                        "",
                        currentStageLabel || "پیشرفت پروژه"
                    )
                );

                progressHeader.appendChild(
                    makeElement("span", "", percent + "٪")
                );

                card.appendChild(progressHeader);

                const track = makeElement(
                    "div",
                    "workshop-project-progress-track"
                );

                track.setAttribute("aria-hidden", "true");

                const fill = makeElement(
                    "div",
                    "workshop-project-progress-fill"
                );

                fill.style.width = percent + "%";
                track.appendChild(fill);
                card.appendChild(track);

                card.appendChild(
                    makeElement(
                        "div",
                        "workshop-project-card-footer",
                        "مشاهده جزئیات پروژه"
                    )
                );

                card.addEventListener("click", () => {

                    const tender = invitation.tender;
                    const tenderId =
                        invitation.tender_id ||
                        (
                            tender &&
                            typeof tender === "object"
                                ? tender.id
                                : tender
                        );

                    this.openProject({
                        ...invitation,
                        title: title,
                        project_title: title,
                        project_id: projectId,
                        tender_id: tenderId,
                        tender_title: invitation.tender_title || "",
                        project_progress: progress
                    });
                });

                container.appendChild(card);
            });
        },


        openProject: function (project) {

            this.currentProject =
                project;

            if (window.WorkshopProject) {

                WorkshopProject.open(
                    project
                );

            }

        },


        openTender: function (tender) {

            this.currentTender =
                tender;

            if (window.WorkshopTender) {

                WorkshopTender.open(
                    tender
                );

            }

        },


        bindModalEvents: function () {

            document
                .querySelectorAll(
                    "[data-close-workshop-modal]"
                )
                .forEach((element) => {

                    element.addEventListener(
                        "click",
                        () => {

                            this.closeProjectModal();

                        }
                    );

                });


            document
                .querySelectorAll(
                    "[data-close-file-modal]"
                )
                .forEach((element) => {

                    element.addEventListener(
                        "click",
                        () => {

                            this.closeFileModal();

                        }
                    );

                });


            document.addEventListener(
                "keydown",
                (event) => {

                    if (event.key !== "Escape") {
                        return;
                    }

                    this.closeProjectModal();

                    this.closeFileModal();

                }
            );

        },


        closeProjectModal: function () {

            const modal =
                document.getElementById(
                    "workshop-project-modal"
                );


            if (!modal) {
                return;
            }


            modal.classList.remove("open");

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        },


        openFileModal: function (
            specificationId,
            title
        ) {

            if (
                window.WorkshopTender
            ) {

                WorkshopTender.openFiles(
                    specificationId,
                    title
                );

            }

        },


        closeFileModal: function () {

            const modal =
                document.getElementById(
                    "workshop-file-modal"
                );


            if (!modal) {
                return;
            }


            modal.classList.remove("open");

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    };


    document.addEventListener(
        "DOMContentLoaded",
        () => {

            WorkshopApp.init();

        }
    );


})();
