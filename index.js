import { fetchHtml } from "./src/fetcher.js";
import { parseHtml, parseBlogPage } from "./src/parser.js";
import { saveDataToFile } from "./src/storage.js";
import { delay } from "./src/utils.js";
import { logger } from './src/logger.js';
import pLimit from 'p-limit';

import "dotenv/config";

(async () => {
    const url = 'https://growthlist.co/tech-blogs/';
    logger.info(`Crawling ${url}...`);
    console.time('With Concurrency');
    
    const html = await fetchHtml(url);
    if(html) {
        const blogURLs = parseHtml(html);
        logger.info(`Extracted ${blogURLs.length} BlogURLs: ${JSON.stringify(blogURLs)}`);

        const limit = pLimit(5);
        const delayMs = 5;    // 500ms delay between requests

        const blogDataPromises = blogURLs.map((blogURL, index) => 
            limit(async () => {
                await delay(delayMs * index);
                const blogHtml = await fetchHtml(blogURL);
                
                if (blogHtml) {
                    const parsedData = parseBlogPage(blogHtml);
                    return { blogURL, ...parsedData }; // Include blog URL and HTML content
                } else {
                    logger.error(`Failed to fetch ${blogURL}`);
                    return null; // Return null for failed fetches
                }
            })
        );
        const blogData = (await Promise.all(blogDataPromises)).filter(data => data);
        logger.info('Blog Data to Save:', blogData);

        if (blogData.length > 0) {
            await saveDataToFile(blogData, 'crawledBlogs.json');
        } else {
            logger.info('No data to save');
        }
        console.timeEnd('With Concurrency');

    }else{
        logger.info(`Failed to crawl ${url}`);        
    }
    
})();