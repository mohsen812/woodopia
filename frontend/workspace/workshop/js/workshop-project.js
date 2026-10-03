(function () {

    "use strict";


    window.WorkshopProject = {


        currentProject: null,


        open: function (project) {


            if (!project) {

                console.error(
                    "WorkshopProject.open: project missing"
                );

                return;

            }


            this.currentProject = {
                ...project
            };


            console.log(
                "Workshop current project:",
                this.currentProject
            );


            const modal =
                document.getElementById(
                    "workshop-project-modal"
                );


            if (!modal) {

                console.error(
                    "workshop-project-modal not found"
                );

                return;

            }


            const title =
                document.getElementById(
                    "workshop-project-title"
                );


            const subtitle =
                document.getElementById(
                    "workshop-project-subtitle"
                );


            if (title) {

                title.textContent =
                    project.title ||
                    project.project_title ||
                    "پروژه";

            }


            if (subtitle) {

                subtitle.textContent =
                    project.tender_title
                    ? `مناقصه: ${project.tender_title}`
                    : "پروژه کارگاه";

            }


            this.renderSummary(
                this.currentProject
            );


            this.bindTabs();


            modal.classList.add(
                "open"
            );


            modal.setAttribute(
                "aria-hidden",
                "false"
            );


        },



        renderSummary: function (project) {


            const container =
                document.getElementById(
                    "workshop-project-summary"
                );


            if (!container) {
                return;
            }



            container.innerHTML = `

                <div class="summary-box">

                    <span>
                        پروژه
                    </span>

                    <strong>
                        ${this.escape(
                            project.title ||
                            project.project_title ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="summary-box">

                    <span>
                        مناقصه
                    </span>

                    <strong>
                        ${this.escape(
                            project.tender_title ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="summary-box">

                    <span>
                        Tender ID
                    </span>

                    <strong>
                        ${
                            project.tender_id ||
                            project.tender ||
                            "-"
                        }
                    </strong>

                </div>

            `;


        },



        bindTabs: function () {


            const modal =
                document.getElementById(
                    "workshop-project-modal"
                );


            if (!modal) {
                return;
            }



            const tabs =
                modal.querySelectorAll(
                    "[data-project-tab]"
                );


            const contents =
                modal.querySelectorAll(
                    "[data-project-content]"
                );



            tabs.forEach(
                tab => {


                    tab.onclick = () => {


                        const target =
                            tab.dataset.projectTab;



                        tabs.forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item === tab
                                );

                            }
                        );



                        contents.forEach(
                            content => {

                                content.classList.toggle(
                                    "active",
                                    content.dataset.projectContent === target
                                );

                            }
                        );



                        console.log(
                            "Workshop project tab:",
                            target
                        );



                        if (
                            target === "standardization" &&
                            window.WorkshopTender
                        ) {


                            const tenderId =
                                this.currentProject.tender_id ||
                                this.currentProject.tender;
                            const bidId =
                                this.currentProject.bid_id ||
                                null;


                            console.log(
                                "Loading tender:",
                                    tenderId,
                            );



                            if (!tenderId) {


                                console.error(
                                    "Tender ID missing",
                                    this.currentProject
                                );


                                WorkshopTender.renderTenderMessage(
                                    "شناسه مناقصه برای پروژه موجود نیست."
                                );


                                return;

                            }



                            WorkshopTender.loadTender(
                                    tenderId,
								bidId
                            );


                        }


                    };


                }
            );


        },



        escape: function (value) {


            return String(
                value ?? ""
            )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );


        }


    };


})();