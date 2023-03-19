import { Db, Document } from "mongodb"

export async function selectRandomSong(
  db: Db
): Promise<Document | null>{
  const posts = db.collection('gt_posts');
  const post = await posts.aggregate([
      { $match: { link_source: 'youtube'}},
      { $sample: { size: 1 }}
    ])
    .toArray();

  if (!post?.[0]){
    return null;
  };
  return post[0]
};