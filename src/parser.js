import * as cheerio from 'cheerio';

export function parseHtml(html) {
    if (!html) {
        return null;
    }
    const $ = cheerio.load(html);
    const blogURLs = [];
    $('a').each((index, element) => {
        const url = $(element).attr('href');
        if (url) {
            blogURLs.push(url);
        }
    });
    return blogURLs;
}

export const parseBlogPage = (html) => {
    if (!html) {
        return null;
    }
    const $ = cheerio.load(html);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';
    const author = $('meta[name="author"]').attr('content') || 'Unknown';
    const publishedDate = $('meta[property="article:published_time"]').attr('content') || 'Unknown';

    console.log(`Parsed Page : ${title}`);
    return {
        title,
        description,
        author,
        publishedDate
    };
};