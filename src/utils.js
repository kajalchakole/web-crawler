import crypto from "crypto";

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async (fn, retries = 3, delayMs = 1000) => {
    let attempts = 0;
    while(attempts < retries) {
        try{
            return await fn();
        } catch(error) {
            attempts++;
            console.error(`Attempt ${attempts} failed: ${error.message}`);
            if(attempts < retries) {
                await delay(delayMs);
            } else {
                console.error(`All ${retries} attempts failed`);
                throw error;
            }
        }
    }
};

export const generateHash = (content) => {
    return crypto.createHash('sha256').update(content).digest('hex');
}