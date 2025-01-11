import axios from 'axios';
import { retry } from "./utils.js";
import { Redis } from "ioredis";

const redis = new Redis();

export async function fetchHtml(url) {
    try {
        const response = await retry(() => axios.get(url));
        console.log(`Fetched ${url}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        return null;
    }
}

export const isUrlProcessed = async (url) => {
    const exists = await redis.sismember('processed_urls', url);
    if(!exists) {
        await redis.sadd('processed_urls', url);
        return false;
    }
    return true;
};