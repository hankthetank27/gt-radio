import { Response, Request, NextFunction } from "express";
import { Db } from "mongodb";

interface queryFilters {
  userName: string | undefined;
  trackTitle: string | undefined;
  text: string | undefined;
  source: string | undefined;
};

interface sortOptions{
  sortBy: 'date' | 'reacts' | 'source';
  direction: 'asc' | 'dec'; 
};

export const queryArchive = { 

  search: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    const { userName, trackTitle, text, source } = req.query;
    const GtDb: Db = req.app.locals.gtdb;
    
  },

  showUsers: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    try{

      const name = req.query.name;
      const GtDb: Db = req.app.locals.gtdb;

   // list users that match query with wildcard in order of posts made
      const users = await GtDb.collection('gt_posts')
        .aggregate([
          { $search: {
            wildcard: {
              path: 'user_name',
              query: `${name}*`
            }
          }}
        ])
        .toArray();
        
      res.locals.users = users;
      return next(); 

    } catch(err) {
      return next(`Error getting user list ${err}`);
    };
  }
};