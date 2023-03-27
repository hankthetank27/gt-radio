import express from "express";
import { controllers } from "../controllers/controllers";
import { chat } from "../db/chat";

export const apiRouter =
  express.Router()
    .get('/chatHistory', 
      (_, res) => res.json(chat.messages)
    )
    .post('/createUser', 
      controllers.createNewUser,
      controllers.createJWT, 
      controllers.setJWTCookie, 
      (_, res) => res.json(res.locals.username)
    )
    .post('/login',
      controllers.verifyUserLogin,
      controllers.createJWT,
      controllers.setJWTCookie,
      (_, res) => res.json(res.locals.username)
    )

