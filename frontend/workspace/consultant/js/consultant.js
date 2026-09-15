(function () {

    "use strict";


    function loadDashboard() {


        fetch(
            "/api/projects/consultant/dashboard/"
        )

        .then(
            response => response.json()
        )

        .then(
            data => {


                const queue =
                    document.getElementById(
                        "queue-count"
                    );


                const projects =
                    document.getElementById(
                        "my-projects-count"
                    );


                const tenders =
                    document.getElementById(
                        "tenders-count"
                    );



                if (queue) {

                    queue.innerText =
                        data.queue_count;

                }



                if (projects) {

                    projects.innerText =
                        data.my_projects_count;

                }



                if (tenders) {

                    tenders.innerText =
                        data.active_tenders_count;

                }


            }
        )

        .catch(
            error => {
                console.error(
                    "Dashboard error:",
                    error
                );
            }
        );


    }



    document.addEventListener(
        "DOMContentLoaded",
        loadDashboard
    );


})();