const API_BASE =
    "http://127.0.0.1:8000/api";



async function apiGet(endpoint){


    const response =
        await fetch(
            `${API_BASE}${endpoint}`
        );


    if(!response.ok){

        throw new Error(
            "API Error: " +
            response.status
        );

    }


    return await response.json();


}