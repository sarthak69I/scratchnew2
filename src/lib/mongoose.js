import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

if (!MONGODB_URI) throw new Error('Please define MONGODB_URI in .env');
if (!DATABASE_NAME) throw new Error('Please define DATABASE_NAME in .env');

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { dbName: DATABASE_NAME }).then((m) => m);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}