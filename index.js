import { fetchHtml } from "./src/fetcher.js";
import { parseHtml, parseBlogPage } from "./src/parser.js";
import { saveDataToFile } from "./src/storage.js";
import { delay } from "./src/utils.js";
import { logger } from './src/logger.js';
import { connectToDatabase } from './src/db.js';
import { Blog } from './src/models/Blog.js'
import mongoose from 'mongoose';

import pLimit from 'p-limit';

import "dotenv/config";

(async () => {
    const url = 'https://growthlist.co/tech-blogs/';
    logger.info(`Crawling ${url}...`);
    console.time('With Concurrency');
    process.report.writeReport('./reports/my-report.json');
console.log('Diagnostic report written!');

    try {
        await connectToDatabase();
    } catch (error) {
        logger.error(`Database connection failed: ${error.message}`);
        process.exit(1); // Exit the process on critical failure
    }

    const html = await fetchHtml(url);
    if(html) {
        const blogURLs = parseHtml(html);
        logger.info(`Extracted ${blogURLs.length} BlogURLs: ${JSON.stringify(blogURLs)}`);

        const limit = pLimit(process.env.CONCURRENCY || 5);
        const delayMs = process.env.DELAY_MS || 500;    // 500ms delay between requests

        const blogDataPromises = blogURLs.map((blogURL) => 
            limit(async () => {
                await delay(delayMs);
                const blogHtml = await fetchHtml(blogURL);
                
                if (blogHtml) {
                    const parsedData = parseBlogPage(blogHtml);
                    return { url:blogURL, ...parsedData }; // Include blog URL and HTML content
                } else {
                    logger.error(`Failed to fetch ${blogURL}`);
                    return null; // Return null for failed fetches
                }
            })
        );
        const blogData = (await Promise.all(blogDataPromises)).filter(data => data);
        logger.info('Blog Data to Save:', blogData);

        for (const blog of blogData) {
            try {
                await Blog.updateOne(
                    { url: blog.url },
                    blog,
                    { upsert: true }
                );
                logger.info(`Data saved for ${blog.url}`);
            } catch (error) {
                logger.error(`Error saving data for ${blog.url}: ${error.message}`);
            }
        }
        console.log(`Data saved for ${blogData.length} URLs in DataBase`);        
        const failedURLs = blogURLs.length - blogData.length;
        logger.info(`Total URLs: ${blogURLs.length}, Processed: ${blogData.length}, Failed: ${failedURLs}`);

        console.timeEnd('With Concurrency');
    }else{
        logger.info(`Failed to crawl ${url}`);        
    }  
    
    gracefulShutdown("SIGINT");

})();

const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Closing database connection...`);
    try {
        await mongoose.connection.close();
        logger.info('Database connection closed');
        process.exit(0);
    } catch (error) {
        logger.error(`Error closing database connection: ${error.message}`);
        process.exit(1);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);