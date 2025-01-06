import axios from 'axios';
import { retry } from "./utils.js";


export async function fetchHtml(url) {
    try {
        const response = await retry(() => axios.get(url));
        console.log(`Fetched ${url}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        return null;d
    }
}