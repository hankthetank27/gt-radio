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

    const { 
      userName, 
      trackTitle, 
      text, 
      source 
    } = req.query;

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
      const argAutocompplete = {
        $search: {
          index: 'user_name_autocomplete',
          autocomplete: {
            query: `${name}`,
            path: 'user_name'
          }
        }
      };

      const argGroup = [{
        $group: {
          _id: "$user_name",
          sum: {$sum:1}
        }},
        {$sort: {
          sum: -1
        }},
        {$limit: 20},
      ];

      const posts = GtDb.collection('gt_posts')
      const users = await posts.aggregate(
        name
          ? [argAutocompplete, ...argGroup]
          : argGroup
        )
        .toArray();

      res.locals.users = users;
      return next(); 

    } catch(err) {
      return next(`Error getting user list ${err}`);
    };
  }
};