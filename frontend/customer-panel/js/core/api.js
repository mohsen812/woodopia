/*
============================================================
 FEEMAAS CUSTOMER PANEL
 API CORE
============================================================
*/


const CUSTOMER_API_BASE =
    "http://127.0.0.1:8000/api";



async function apiGet(endpoint){

    try {


        const response =
            await fetch(
                CUSTOMER_API_BASE + endpoint
            );



        if(!response.ok){

            throw new Error(
                "API ERROR: " + response.status
            );

        }



        return await response.json();


    }
    catch(error){


        console.error(
            "FEEMAAS API GET ERROR:",
            error
        );


        throw error;


    }

}





async function apiPost(
    endpoint,
    data
){


    try {


        const response =
            await fetch(
                CUSTOMER_API_BASE + endpoint,
                {

                    method:"POST",

                    headers:{

                        "Content-Type":
                            "application/json"

                    },


                    body:
                        JSON.stringify(data)

                }
            );



        if(!response.ok){

            throw new Error(
                "API ERROR: " + response.status
            );

        }



        return await response.json();



    }
    catch(error){


        console.error(
            "FEEMAAS API POST ERROR:",
            error
        );


        throw error;


    }


}





window.FEEMAAS_API = {

    get:apiGet,

    post:apiPost

};