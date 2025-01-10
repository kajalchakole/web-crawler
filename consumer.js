import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: 'webcrawler-consumer',
    brokers: [process.env.KAFKA_BROKERS]
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