import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let cachedClientPromise: Promise<MongoClient> | undefined;

// Create a lazy promise that only connects when awaited
const clientPromise = new Promise<MongoClient>((resolve, reject) => {
  // Defer the actual connection until microtask/next tick
  Promise.resolve().then(() => {
    if (!uri) {
      reject(new Error('Please add your Mongo URI to .env.local'));
      return;
    }
    
    if (!cachedClientPromise) {
      if (process.env.NODE_ENV === 'development') {
        const globalWithMongo = global as typeof globalThis & {
          _mongoClientPromise?: Promise<MongoClient>;
        };
        if (!globalWithMongo._mongoClientPromise) {
          const client = new MongoClient(uri, options);
          globalWithMongo._mongoClientPromise = client.connect();
        }
        cachedClientPromise = globalWithMongo._mongoClientPromise;
      } else {
        const client = new MongoClient(uri, options);
        cachedClientPromise = client.connect();
      }
    }
    
    cachedClientPromise.then(resolve).catch(reject);
  });
});

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
