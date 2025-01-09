import axios from 'axios';
import robotsParser from 'robots-parser';
import Redis from 'ioredis';

const redis = new Redis(); //Connect to Redis

const fetchRobotsTxt = async (domain) => {
    const url = `${domain}/robots.txt`;
    const cacheKey = `robots:${domain}`;
    const cachedRobotsTxt = await redis.get(cacheKey);
    let robotsText;

    if (cachedRobotsTxt) {
        console.log(`Using cached robots.txt for ${domain}: ${cachedRobotsTxt}`);
        robotsText = cachedRobotsTxt;
    } else {
        try {
            const response = await axios.get(url, { timeout: 5000 });
            robotsText = response.data;
            await redis.setex(cacheKey, 86400, robotsText);
            console.log(`Set robots.txt for ${domain}`);
        } catch (error) {
            console.warn(`Error fetching robots.txt for ${domain}: ${error.message}`);
            robotsText = 'User-agent: *\nAllow: /';
            await redis.setex(cacheKey, 86400, robotsText);
        }
    }
    const robots = robotsParser(url, robotsText);

    return {
        rules: robots.rules || [],
        crawlDelay: robots.getCrawlDelay('*') || 0
    };
};

const isUrlAllowed = (robots, url) => {
    if (!robots || !robots.rules) {
        return true;
    }

    const disallowedPaths = robots.rules.filter((rule) => rule.disallowed).map((rule) => rule.path);
    return !disallowedPaths.some((path) => url.includes(path));
};

const getCrawlDelay = (robots) => robots.crawlDelay || 0;

export { fetchRobotsTxt, isUrlAllowed, getCrawlDelay };