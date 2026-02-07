import {MongoClient, ServerApiVersion} from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI!, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
      await mongoClient.connect();
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      await mongoClient.close();
    }
}
export default mongoClient;