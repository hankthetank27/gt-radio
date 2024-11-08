import express from "express";
import { auth } from "../controllers/auth";
import { chat } from "../db/chat";
import { queryArchive } from "../controllers/queryArchive";
import { stream } from "../controllers/stream"

export const apiRouter = express.Router()

  .get('/chatHistory', 
    (_, res) => res.json(chat.messages)
  )

  .post('/createUser', 
    auth.createNewUser,
    auth.setJwt, 
    (_, res) => res.json({
      username: res.locals.username,
      chatColor: res.locals.chatColor,
      jwt: res.locals.jwt
    })
  )

  .post('/login',
    auth.verifyUserLogin,
    auth.setJwt,
    (_, res) => res.json({
      username: res.locals.username,
      chatColor: res.locals.chatColor,
      jwt: res.locals.jwt
    })
  )

  .get('/verifySession',
    auth.vaildateJwt,
    (_, res) => res.json({
      username: res.locals.username,
      chatColor: res.locals.chatColor
    })  
  )

  .get('/listArchiveUsers',
    queryArchive.showUsers,
    (_, res) => res.json({
      users: res.locals.users
    })
  )

  .post('/memberLogin',
    auth.verifyMemberLogin,
    (_, res) => res.sendStatus(200)
  )
  
  .get('/verifyMemberSession',
    auth.verifyMemberSession,
    (_, res) => res.sendStatus(200)
  )

  .get('/getPosts',
    (_, res, next) => {
      res.locals.getAll = false;
      return next();
    },
    queryArchive.search,
    (_, res) => res.json({
      posts: res.locals.selectedPosts
    })
  )

  .get('/getAllPosts',
    auth.verifyMemberSession,
    (_, res, next) => {
      res.locals.getAll = true;
      return next();
    },
    queryArchive.search,
    (_, res) => res.json({
      posts: res.locals.selectedPosts
    })
  );

export const streamRouter = express.Router()

  .get('/:streamId/index.m3u8',
    stream.setHLSHeaders,
    stream.getPlaylist,
  )

  .get('/:streamId/:segment',
    stream.setHLSHeaders,
    stream.sendSegements,
  );

