/*
============================================================
 FEEMAAS CUSTOMER PANEL
 ROUTER ENGINE
============================================================
*/


const CUSTOMER_ROUTES = {


    dashboard:
        "dashboard",


    projects:
        "projects",


    "create-project":
        "create-project",


    tenders:
        "tenders",


    messages:
        "messages",


    contracts:
        "contracts",


    files:
        "files"


};



async function loadCustomerView(view){


    const container =
        document.getElementById(
            "customer-view"
        );


    if(!container){

        console.error(
            "Customer view container not found"
        );

        return;

    }



    /*
    ------------------------------------------
    Update active sidebar
    ------------------------------------------
    */


    document
    .querySelectorAll(
        ".customer-nav-item"
    )
    .forEach(
        item=>{


            item.classList.remove(
                "active"
            );


            if(
                item.dataset.view === view
            ){

                item.classList.add(
                    "active"
                );

            }


        }
    );



    /*
    ------------------------------------------
    Render page
    ------------------------------------------
    */

switch(view){


    case "dashboard":


        if(
            typeof renderCustomerDashboard === "function"
        ){

            renderCustomerDashboard();

        }

    break;



    case "projects":


        if(
            typeof loadProjectsPage === "function"
        ){

            loadProjectsPage();

        }

    break;



    case "create-project":


        if(
            typeof renderCreateProject === "function"
        ){

            renderCreateProject();

        }

    break;



        default:


            container.innerHTML = `


            <div class="glass-panel">


                <span class="eyebrow">
                FEEMAAS
                </span>


                <h2>
                ${view}
                </h2>


                <p>
                این بخش در حال توسعه است.
                </p>


            </div>


            `;


    }


}



window.CustomerRouter = {


    navigate(view){

        loadCustomerView(
            view
        );

    }


};



window.loadCustomerView =
    loadCustomerView;