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