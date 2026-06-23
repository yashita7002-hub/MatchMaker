import mongoose from 'mongoose';


let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}
console.log("MONGODB_URI =>", process.env.MONGODB_URI);
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  console.log("MONGODB_URI =", process.env.MONGODB_URI);
   console.log(MONGODB_URI)
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local or .env'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MONGODB_URI =", process.env.MONGODB_URI);
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
