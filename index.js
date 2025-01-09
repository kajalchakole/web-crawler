import { Worker } from 'worker_threads';
import { fetchHtml } from "./src/fetcher.js";
import { parseHtml } from "./src/parser.js";
import { logger } from './src/logger.js';
import { fetchRobotsTxt, getCrawlDelay } from './src/robot.js';

import "dotenv/config";

const runWorker = (workerData) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./src/worker.js', { workerData });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if(code !== 0){
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
};

(async () => {
    console.time('With Concurrency');

    const domain = 'https://growthlist.co';
    const robots = await fetchRobotsTxt(domain);
    const crawlDelay = getCrawlDelay(robots, '*');

    logger.info(`Crawl Delay: ${crawlDelay} seconds`);

    const url = 'https://growthlist.co/tech-blogs/';
    logger.info(`Crawling ${url}...`);


    const html = await fetchHtml(url);

    if (!html) {
        logger.error(`Failed to fetch the base URL: ${baseURL}`);
        return;
    }

    const blogURLs = parseHtml(html);
    // logger.info(`Extracted ${blogURLs.length} BlogURLs: ${JSON.stringify(blogURLs)}`);

    const numWorkers = Math.min(blogURLs.length, 4);
    const chunkSize = Math.ceil(blogURLs.length / numWorkers);
    const urlChunks = [];

    for (let i = 0; i < blogURLs.length; i += chunkSize) {
        urlChunks.push(blogURLs.slice(i, i + chunkSize));
    }

    logger.info(`Distributing ${blogURLs.length} URLs across ${numWorkers} workers...`);

    const workerPromises = urlChunks.map((chunk, index) => runWorker( { urls: chunk, robotsData: robots, workerId: index+1 } ));

    try {
        const results = await Promise.all(workerPromises);
        logger.info('All workers completed successfully');
        console.log(`Crawled Data: ${JSON.stringify(results.flat(), null, 2)}`);
        
    } catch (error) {
        logger.error(`Error in worker: ${error.message}`);
    }finally {
        logger.info('Database connection closed.');
        console.timeEnd('With Concurrency');
        process.exit(0);
    }
})();

