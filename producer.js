import { Kafka } from "kafkajs";
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
    clientId: 'webcrawler-producer',
    brokers: [`${process.env.KAFKA_BROKER_IP}:${process.env.KAFKA_BROKER_PORT}`],
});

const producer = kafka.producer();

const run = async () => {
    await producer.connect();

    const urls = [
        'https://growthlist.co/tech-blogs/'
    ];

    for (const url of urls) {
        if (!url) {
            console.error('Skipping undefined or null URL');
            continue;
        }
        console.log(`Sending URL: ${url}`);
        await producer.send({
            topic: 'webcrawler-urls',
            messages: [{ value: url }]
        });
        
        console.log(`Added URL to webcrawler-urls topic: ${url}`);        
    }

    await producer.disconnect();
    console.log('Producer disconnected');
    
};

run().catch(console.error);