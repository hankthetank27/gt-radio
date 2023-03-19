import { MongoClient } from "mongodb";

export async function initGtArchive() {
  const connectionString = process.env.GT_ARCHIVE_CONNECTION_STRING;

  if (!connectionString){
    throw new Error('Invalid connection string: initGtArchive');
  };

  const client = new MongoClient(connectionString);

  try {
    await client.connect();
    return client.db('gt_data');
  } catch(err) {
    console.error(`Error connecting to gt archive: ${err}`);
  }
};
