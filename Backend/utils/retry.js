
export const sleep = (ms) => new Promise(res => setTimeout(res, ms));

export const retry = async(fn, retries = 3, delay = 2000) => {

    let attempt;

    for(attempt = 0; attempt < retries; attempt++){

        try{

            return await fn();

        }

        catch(err){

            if (err.status === 429 || err.code === "ECONNRESET") {
                console.log(`Retry ${attempt}/${retries} after ${delay}ms...`);
                await sleep(delay);
            } 
            
            else {
                throw err;
            }

        }

    }

    throw new Error(
        "Service might be busy or rate-limited. Please try again later."
    );
    
}