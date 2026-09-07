const API_BASE = "http://127.0.0.1:8000/api";


async function handleApiError(response){

    let detail = "";

    try {

        const errorData = await response.json();

        detail =
            errorData.error ||
            JSON.stringify(errorData);

    }
    catch(e){

        try {
            detail = await response.text();
        }
        catch(err){
            detail = "";
        }

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

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(data)
        }
    );


    if(!response.ok){

        await handleApiError(response);

    }


    return await response.json();

}