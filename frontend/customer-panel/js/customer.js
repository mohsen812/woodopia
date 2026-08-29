/*
============================================================
 FEEMAAS CUSTOMER PANEL
 BOOTSTRAP
============================================================
*/


console.log(
    "FEEMAAS Customer Panel Loaded"
);



document.addEventListener(
    "DOMContentLoaded",
    function(){


        console.log(
            "Customer Panel Initializing..."
        );



        if(
            typeof initializeCustomerSidebar === "function"
        ){

            initializeCustomerSidebar();


            console.log(
                "Customer Sidebar Initialized"
            );

        }
        else {

            console.error(
                "Sidebar initializer not found"
            );

        }



        if(
            typeof loadCustomerView === "function"
        ){

            loadCustomerView(
                "dashboard"
            );

        }


    }
);