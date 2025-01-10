import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI; // MongoDB running on your Mac
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function testConnection() {
    try {
        await client.connect();
        console.log('Connected to MongoDB!');
        const db = client.db('test'); // Replace 'test' with your database name
        const collection = db.collection('testCollection');
        await collection.insertOne({ key: 'value' });
        console.log('Test data inserted successfully!');
        const result = await collection.findOne({ key: 'value' });
        console.log('Retrieved data:', result);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    } finally {
        await client.close();
        console.log('MongoDB connection closed.');
    }
}

testConnection();
