import axios from 'axios';
import robotsParser from 'robots-parser';
import Redis from 'ioredis';

const redis = new Redis(); //Connect to Redis

const fetchRobotsTxt = async (domain) => {
    const url = `${domain}/robots.txt`;
    const cacheKey = `robots:${domain}`;
    const cachedRobotsTxt = await redis.get(cacheKey);

    if(cachedRobotsTxt){
        console.log(`Using cached robots.txt for ${domain}: ${cachedRobotsTxt}`);
        return robotsParser(url, cachedRobotsTxt);
    }

    try {
        const response = await axios.get(url, { timeout: 5000});
        await redis.setex(cacheKey, 86400, response.data);
        console.log(`Set robots.txt for ${domain}`);
        
        return robotsParser(url, response.data);
    } catch (error) {
        console.warn(`Error fetching robots.txt for ${domain}: ${error.message}`);
        const defaultTxt = 'User-agent: *\nAllow: /';
        await redis.setex(cacheKey, 86400, defaultTxt);

        return robotsParser(url, defaultTxt);
    }
};

const isUrlAllowed = (robots, url, userAgent = '*') => {
    if(!robots){
        return true;
    }

    return robots.isAllowed(url, userAgent);
};

const getCrawlDelay = (robots, userAgent = '*') => {
    if(!robots){
        return 0;
    }

    return robots.getCrawlDelay(userAgent) || 0;
}

export { fetchRobotsTxt, isUrlAllowed, getCrawlDelay };