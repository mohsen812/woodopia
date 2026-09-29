const API_BASE = "/api";


async function handleApiError(response){

    let detail = "";

    try {

        const errorData = await response.json();

        detail =
            errorData.error ||
            JSON.stringify(errorData);

    }
    catch(e){

        detail = await response.text();

    }


    console.error(
        "FEEMAAS API ERROR:",
        response.status,
        detail
    );


    throw new Error(
        "API Error: " +
        response.status +
        " - " +
        detail
    );

}



async function apiGet(endpoint){

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            credentials:"include",
        }
    );


    if(!response.ok){

        await handleApiError(response);

    }


    return await response.json();

}




async function apiPost(endpoint,data){

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {

            method:"POST",

            credentials:"include",

            headers:{

                "Content-Type":
                "application/json",

                "X-CSRFToken":
                getCookie("csrftoken")

            },

            body:
            JSON.stringify(data)

        }
    );


    if(!response.ok){

        await handleApiError(response);

    }


    return await response.json();

}




function getCookie(name){

    let cookieValue = null;


    if(document.cookie){

        const cookies =
        document.cookie.split(";");


        for(let cookie of cookies){

            cookie =
            cookie.trim();


            if(
                cookie.startsWith(
                    name+"="
                )
            ){

                cookieValue =
                decodeURIComponent(
                    cookie.substring(
                        name.length+1
                    )
                );


                break;

            }

        }

    }


    return cookieValue;

}