
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });


import connectDB from './src/lib/db';

async function run() {
  console.log('Verifying Database Connection...');
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('\n✗ MONGODB_URI is NOT loaded from .env');
    console.error('  Make sure .env exists in:', process.cwd());
    process.exit(1);
  }

  console.log('✓ MONGODB_URI loaded from .env');
  console.log('  Connecting to:', uri.replace(/:([^@]+)@/, ':****@')); 
  
  try {
    await connectDB();
    console.log('✓ Successfully connected to MongoDB Atlas!');
    process.exit(0);
  } catch (err: any) {
    console.error('\n✗ Connection Failed!');
    console.error(err.message || err);
    process.exit(1);
  }
}

run();
