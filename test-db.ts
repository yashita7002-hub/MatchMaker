import mongoose from 'mongoose';

const uri1 = 'mongodb+srv://yashita:yashita%402007@cluster0.fl6ywkl.mongodb.net/project-matchmaker?appName=Cluster0';
const uri2 = 'mongodb://yashita:yashita%402007@ac-uwxo5te-shard-00-00.fl6ywkl.mongodb.net:27017,ac-uwxo5te-shard-00-01.fl6ywkl.mongodb.net:27017,ac-uwxo5te-shard-00-02.fl6ywkl.mongodb.net:27017/project-matchmaker?ssl=true&replicaSet=atlas-c4w70s-shard-0&authSource=admin&retryWrites=true&w=majority';

async function test() {
  console.log('Testing uri2 (direct hosts)...');
  try {
    await mongoose.connect(uri2, { serverSelectionTimeoutMS: 5000 });
    console.log('uri2 connection SUCCESS!');
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('uri2 connection FAILED:', message);
  }
}
test();
