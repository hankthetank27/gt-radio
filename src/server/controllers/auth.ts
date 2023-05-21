import { Response, Request, NextFunction } from "express";
import { Db } from "mongodb";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import makeColor from "../../utils/makeColor";


export const auth = {

  createNewUser: async (
    req: Request, 
    res: Response, 
    next: NextFunction
  ) => {

    const { username, password } = req.body;
    const GtDb: Db = req.app.locals.gtdb;

    if (!GtDb){
      return next('Could not connect to DB');
    };

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
      const chatColor = makeColor();

      await GtDb
        .collection('users')
        .insertOne({
          username: username,
          password: hashedPw,
          chatColor: chatColor
        });

      res.locals.username = username;
      res.locals.chatColor = chatColor;
      return next();

    } catch (err) {
      return next(`Error creating new user ${err}`);
    };
  },


  verifyUserLogin: async (
    req: Request, 
    res: Response, 
    next: NextFunction
  ) => {

    const { username, password } = req.body;
    const GtDb: Db = req.app.locals.gtdb;

    if (!GtDb){
      return next('Could not connect to DB');
    };

    if (!username || !password){
      return res.status(401).send('User does not exist');
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

      res.locals.username = user.username;
      res.locals.chatColor = user.chatColor;
      return next();

    } catch (err) {
      return next(`Error creating new user ${err}`);
    };
  },


  setJwt: (
    _: Request, 
    res: Response, 
    next: NextFunction
  ) => {

    const username = res.locals.username;
    const chatColor = res.locals.chatColor;
    const jwtKey = process.env.JWT_KEY;

    if (!username || !jwtKey){
      return next('Could not creat JWT');
    };

    const accessToken = jwt.sign(
      {
        username: username,
        chatColor: chatColor
      },
      jwtKey, 
      { expiresIn: "25d" }
    );

    res.locals.jwt = accessToken;

    return next();
  },


  vaildateJwt: (
    req: Request, 
    res: Response, 
    next: NextFunction
  ) => {
    try {
      if (!process.env.JWT_KEY) return res.sendStatus(401);
  
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
  
      if (!token) return res.sendStatus(401);

      const { username, chatColor } = jwt.verify(
        token, 
        process.env.JWT_KEY
      ) as jwt.JwtPayload;

      res.locals.username = username;
      res.locals.chatColor = chatColor;

      return next();
    } catch (err) {
      return res.sendStatus(401);
    };
  },


  verifyMemberLogin: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try{
      if (req.body.member_key = process.env.ARCHIVE_KEY){
        res.cookie('gt_member_offical', process.env.ARCHIVE_KEY);
        return next();
      } else {
        res.status(401).send('Invalid key');
      }
    } catch(err){
      return next('Error verifying member login');
    }
  },
  

  verifyMemberSession: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try{
      //TODO: set cookie expires
      if (req.cookies.gt_member_offical === process.env.ARCHIVE_KEY){
        return next();
      } else {
        res.status(401).send('User not authorized');
      }
    } catch(err){
      return next('Error verifying member session');
    }
  },
};
