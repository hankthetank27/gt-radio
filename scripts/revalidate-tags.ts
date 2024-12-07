import dotenv from 'dotenv';
import { initDB } from "../src/server/db/initDB";

dotenv.config();

async function removeS3(): Promise<void> {
  try {
    const db = await initDB();
    if (db){
      console.log('connected to mongoDb: gt_data');
    } else {
      throw new Error('Could not connect to mongoDb: gt_data');
    };

    const posts = db.collection('gt_posts');

    await posts.updateMany(
      {link_source: "youtube"}, 
      { $unset: {temp_invalid: ""}}
    );
    console.log("cleared temp invalid flag");

    console.log("done!")
  } catch(e) {
    console.error("Could not complete uploads: ", e);
  }
}

removeS3();

