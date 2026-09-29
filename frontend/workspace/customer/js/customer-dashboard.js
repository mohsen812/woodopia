document.addEventListener(
    "DOMContentLoaded",
    loadCustomerProjects
);


async function loadCustomerProjects(){

    const container =
    document.getElementById(
        "projects"
    );


    if(!container){
        return;
    }


    try{


        const projects =
        await apiGet(
            "/projects/"
        );


        console.log(
            "CUSTOMER PROJECTS:",
            projects
        );


        if(projects.length === 0){

            container.innerHTML =
            `
            <div class="card">
                هنوز پروژه‌ای ثبت نشده است
            </div>
            `;

            return;

        }



        container.innerHTML = "";

		projects.forEach(
	        project => {

				const card =
				    createProjectCard(
						project
                    );


                container.appendChild(
                    card
                );

	        }
        );



    }
    catch(error){

        console.error(
            error
        );


        container.innerHTML =
        `
        خطا در دریافت پروژه‌ها
        `;

    }

}