import { Response, Request, NextFunction } from "express";
import { Db } from "mongodb";
import bcrypt, { compare } from "bcrypt";

export const controllers = {

  createNewUser: async (req: Request, res: Response, next: NextFunction) => {

    const GtDb: Db = req.app.locals.gtdb;

    if (!GtDb) {
      return next('Could not connect to DB');
    };

    const { username, password } = req.body;

    if (
      !username ||
      !password ||
      username.length > 25 ||
      password.length < 6
    ){
      return res.status(400).send('password invalid');
    };

    try {
      const hashedPw = await bcrypt.hash(password, 5);

      await GtDb
        .collection('users')
        .insertOne({
          username: username,
          password: hashedPw
        });

      res.locals.username = username;
      return next();

    } catch (err) {
      return next(`Error creating new user ${err}`);
    };
  },


  verifyUserLogin: async (req: Request, res: Response, next: NextFunction) => {

    const GtDb: Db = req.app.locals.gtdb;

    if (!GtDb) {
      return next('Could not connect to DB');
    };

    const { username, password } = req.body;

    if (!username || !password){
      return res.sendStatus(401);
    };

    try {

      const user = await GtDb
        .collection('users')
        .findOne({ username: username });

      if (!user){
        return res.status(401).send('User does not exist');
      };

      const isValidPw = await bcrypt.compare(password, user.password);

      if (!isValidPw){
        return res.status(401).send('Incorrect password');
      };

      res.locals.username = username;
      return next();

    } catch (err) {
      return next(`Error creating new user ${err}`);
    };
  },


  createJWT: (req: Request, res: Response, next: NextFunction) => {
    return next();
  },


  setJWTCookie: (req: Request, res: Response, next: NextFunction) => {
    return next();
  },
};