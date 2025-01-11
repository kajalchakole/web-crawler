import { Kafka } from "kafkajs";
import dotenv from 'dotenv';
import { fetchHtml, isUrlProcessed } from "./src/fetcher.js";
import { parseHtml } from "./src/parser.js";
dotenv.config();

const kafka = new Kafka({
    clientId: 'webcrawler-producer',
    brokers: [`${process.env.KAFKA_BROKER_IP}:${process.env.KAFKA_BROKER_PORT}`],
});

const producer = kafka.producer();
let totalUrls = 0;

const run = async () => {
    try {
        await producer.connect();

        const baseUrl = 'https://growthlist.co/tech-blogs/';
        const html = await fetchHtml(baseUrl);


        if (!html) {
            console.error('Failed to fetch base URL');
            return;
        }

        const urls = parseHtml(html);
        console.log(`Extracted ${urls.length} URLs`);
        for (const url of urls) {
            if(await isUrlProcessed(url)) {
                console.log(`Skipping already processed URL: ${url}`);
                continue;
            }

            await producer.send({
                topic: 'webcrawler-urls',
                messages: [{ value: url }],
            });
            totalUrls++;
            console.log(`Sent ${url} to Kafka`);
        }

        console.log(`Sent ${totalUrls} URLs to Kafka`);

    } catch (error) {
        console.error(`Error in producer: ${error.message}`);
    } finally {
        await producer.disconnect();
        console.log('Producer disconnected');
        process.exit(0);
    }

};

run();