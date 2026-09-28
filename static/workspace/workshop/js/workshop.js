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
