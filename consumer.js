import { Kafka } from "kafkajs";
import dotenv from 'dotenv';
import { connectToDatabase } from "./src/db.js";
import { parseBlogPage } from "./src/parser.js";
import { Blog } from './src/models/Blog.js';
import { fetchHtml } from "./src/fetcher.js";
import { generateHash } from "./src/utils.js";

dotenv.config();

const kafka = new Kafka({
    clientId: 'webcrawler-consumer',
    brokers: [`${process.env.KAFKA_BROKER_IP}:${process.env.KAFKA_BROKER_PORT}`],
});


const consumer = kafka.consumer({
    groupId: 'webcrawler-group'
});

const run = async () => {

    try {
        await connectToDatabase();
        await consumer.connect();

        console.log('Consumer connected');

        await consumer.subscribe({
            topic: 'webcrawler-urls',
            fromBeginning: false
        });

        console.log('Consumer is ready and listening for messages...');

        await consumer.run({
            eachMessage: async ({ message }) => {
                const url = message.value.toString();
                console.log(`Processing URL: ${url}`);

                const html = await fetchHtml(url);
                console.log(`Fetched HTML for URL: ${url}`);
                const parsedData = parseBlogPage(html);
                console.log(`Parsed data for URL: ${url}`);
                const contentHash = generateHash(parsedData);
                console.log(`Hash ${contentHash}`);
                const existingHash = await Blog.findOne({ hash: contentHash });
                console.log(`existing hash ${existingHash}`);
                if (!existingHash) {
                    await Blog.updateOne({ url }, { url, ...parsedData, hash: contentHash }, { upsert: true });
                    console.log(`Saved data for URL: ${url}`);
                }else {
                    console.log(`Duplicate content found for URL: ${url}. Skipping save.`);
                }
            }
        });
    } catch (error) {
        console.error(`Error in consumer: ${error.message}`);
    }
};

run();