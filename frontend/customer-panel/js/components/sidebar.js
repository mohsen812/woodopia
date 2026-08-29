function initializeCustomerSidebar(){

    document
    .querySelectorAll(".customer-nav-item")
    .forEach(button=>{


        button.addEventListener(
            "click",
            ()=>{


                document
                .querySelectorAll(".customer-nav-item")
                .forEach(
                    item=>item.classList.remove("active")
                );


                button.classList.add("active");


                const view =
                    button.dataset.view;


                window.CustomerRouter.navigate(
                    view
                );


            }
        );


    });


}