import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: 'webcrawler-producer',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();

const run = async () => {
    await producer.connect();

    const urls = [
        'https://growthlist.co/tech-blogs/'
    ];

    for (const url of urls) {
        await producer.send({
            topic: 'webcrawler-urls',
            message: [{ value: url }]
        });
        
        console.log(`Added URL to webcrawler-urls topic: ${url}`);        
    }

    await producer.disconnect();
    console.log('Producer disconnected');
    
};

run().catch(console.error);