import { Response, Request, NextFunction } from "express";
import path from "path";
import fs from "fs"

export const stream = {

  setHLSHeaders: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    res.setHeader('Cache-Control', 'no-cache');
    const ext = path.extname(req.path);
    switch (ext) {
      case '.m3u8':
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        break;
      case '.ts':
        res.setHeader('Content-Type', 'video/mp2t');
        break;
    }
    next();
  },

  getPlaylist: async (
    req: Request,
    res: Response,
  ) => {
    const { streamId } = req.params;
    const playlistPath = path.join(__dirname, '../../../media/live/', streamId, 'index.m3u8');
    if (!fs.existsSync(playlistPath)) {
      return res.status(404).send('Stream not found');
    }
    res.sendFile(playlistPath);
  },

  sendSegements: async (
    req: Request,
    res: Response,
  ) => {
    const { streamId, segment } = req.params;
    const segmentPath = path.join(__dirname, '../../../media/live/', streamId, segment);
    if (!fs.existsSync(segmentPath)) {
      return res.status(404).send('Segment not found');
    }
    res.sendFile(segmentPath);
  }
}

