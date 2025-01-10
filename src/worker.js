import { parentPort, workerData } from 'worker_threads';
import { fetchHtml } from './fetcher.js';
import { parseBlogPage } from './parser.js';
import { Blog } from './models/Blog.js';
import { isConnectionReady, connectToDatabase, gracefulShutdown } from './db.js';
import { logger } from './logger.js';
import { isUrlAllowed } from './robot.js';

const loadWhyIsNodeRunning = async () => {
    const { default: whyIsNodeRunning } = await import('why-is-node-running');
    return whyIsNodeRunning;
};

const { urls, robotsData, workerId } = workerData;
const crawlDelay = robotsData.crawlDelay;

// Handle signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Worker ${workerId}: Unhandled Rejection at`, promise, 'reason:', reason);
    process.exit(1);
});

(async () => {
    logger.info(`Worker ${workerId} started`);

    try {
        await connectToDatabase();
    } catch (error) {
        logger.error(`Worker ${workerId}: Database connection failed: ${error.message}`);
        process.exit(1);
    }

    const results = [];

    try {
        for (const url of urls) {
            try {
                if (!isUrlAllowed(robotsData, url)) {
                    logger.warn(`Worker ${workerId}: Skipping disallowed URL: ${url}`);
                    continue;
                }

                await new Promise((resolve) => setTimeout(resolve, crawlDelay * 1000));

                const html = await fetchHtml(url);
                if (!html) {
                    logger.warn(`Worker ${workerId}: Failed to fetch HTML for URL: ${url}`);
                    continue;
                }

                const parsedData = parseBlogPage(html);
                if (parsedData) {
                    results.push({ url, ...parsedData });

                    if (!isConnectionReady()) {
                        logger.error(`Worker ${workerId}: MongoDB is not connected. Skipping update operation.`);
                        continue;
                    }
                        await Blog.updateOne({ url }, { url, ...parsedData }, { upsert: true });
                }
            } catch (error) {
                logger.error(`Worker ${workerId}: Error processing URL ${url}: ${error.message}`);
            }
        }
    } catch (error) {
        logger.error(`Worker ${workerId}: General error: ${error.message}`);
    } finally {
        try {
            logger.info(`Worker ${workerId}: Starting graceful shutdown`);
            await gracefulShutdown(`worker ${workerId}`);
            logger.info(`Worker ${workerId}: Graceful shutdown completed`);
        } catch (error) {
            logger.error(`Worker ${workerId}: Error during shutdown: ${error.message}`);
        }

        parentPort.postMessage(results);
        logger.info(`Worker ${workerId}: Sent results to parent port`);

        const whyIsNodeRunning = await loadWhyIsNodeRunning();
        setTimeout(() => {
            whyIsNodeRunning();
        }, 5000);

        logger.info(`Worker ${workerId}: Exiting process`);
        process.exit(0);
    }
})();
