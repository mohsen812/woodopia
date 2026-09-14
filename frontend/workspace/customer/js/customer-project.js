/*
============================================================
 FEEMAAS CUSTOMER PROJECT CREATE
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    () => {


        const button =
            document.getElementById(
                "create-project-button"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            openCreateProjectModal
        );


    }
);



function openCreateProjectModal(){


    const modal =
    document.createElement(
        "div"
    );


    modal.className =
        "project-modal";


    modal.innerHTML = `

        <div class="project-modal-box">


            <h2>
                ایجاد پروژه جدید
            </h2>


            <input
                id="project-title"
                placeholder="عنوان پروژه"
            >


            <textarea
                id="project-description"
                placeholder="توضیحات پروژه"
            ></textarea>


            <input
                id="project-budget"
                placeholder="بودجه تقریبی"
                type="number"
            >


            <input
                id="project-days"
                placeholder="زمان تحویل (روز)"
                type="number"
            >


            <button
                id="save-project-button"
            >
                ثبت پروژه
            </button>


        </div>

    `;


    document.body.appendChild(
        modal
    );



    document
    .getElementById(
        "save-project-button"
    )
    .addEventListener(
        "click",
        createProject
    );


}



async function createProject(){


    const data = {


        title:
            document.getElementById(
                "project-title"
            ).value,


        description:
            document.getElementById(
                "project-description"
            ).value,


        estimated_budget:
            document.getElementById(
                "project-budget"
            ).value || null,


        required_delivery_days:
            document.getElementById(
                "project-days"
            ).value || null,


    };



    try {


        await apiPost(
            "/projects/",
            data
        );



        alert(
            "پروژه با موفقیت ایجاد شد"
        );



        location.reload();



    }
    catch(error){


        console.error(
            error
        );


        alert(
            "خطا در ایجاد پروژه"
        );


    }


}