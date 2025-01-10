import { Kafka } from "kafkajs";
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
    clientId: 'webcrawler-consumer',
    brokers: [`${process.env.KAFKA_BROKER_IP}:${process.env.KAFKA_BROKER_PORT}`],
});


const consumer = kafka.consumer({
    groupId: 'webcrawler-group'
});

const run = async () => {
    await consumer.connect();

    console.log('Consumer connected');

    await consumer.subscribe({
        topic: 'webcrawler-urls',
        fromBeginning: true
    });
    
    console.log('Consumer is ready and listening for messages...');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const url = message.value.toString();
            console.log(`Processing URL: ${url}`);
        }
    });
};

run().catch(console.error);