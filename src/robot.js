import axios from 'axios';
import robotsParser from 'robots-parser';

const fetchRobotsTxt = async (domain) => {
    try {
        const url = `${domain}/robots.txt`;
        const response = await axios.get(url, { timeout: 5000});
        return robotsParser(url, response.data);
    } catch (error) {
        console.warn(`Error fetching robots.txt for ${domain}: ${error.message}`);
        const defaultTxt = 'User-agent: *\nAllow: /';
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