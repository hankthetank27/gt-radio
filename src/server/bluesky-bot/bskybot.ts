import { AtpAgent, RichText } from '@atproto/api';
import * as process from 'process';
import { SongDocument } from '../../@types';
import axios from 'axios';

export async function initBskBot(): Promise<AtpAgent | undefined> {
  try {
    const agent = new AtpAgent({
      service: 'https://bsky.social',
    });
    await agent.login({ 
      identifier: process.env.BLUESKY_USERNAME!, 
      password: process.env.BLUESKY_PASSWORD!
    });
    console.log("Connected to Bluesky agent.");
    return agent;
  } catch(e) {
    console.error(`Error initializing Bluesky bot: ${e}`);
    return;
  }
}

async function makeEmbed(song: SongDocument, agent: AtpAgent) {
  try {
    if (song.link && song.link_source === 'youtube') {
      const ytRes = await axios.get(`https://www.youtube.com/oembed?url=${song.link}&format=json`);
      const thumbBlob = await axios.get(ytRes.data.thumbnail_url, {
        responseType: 'stream' 
      });
      const { data } = await agent.uploadBlob(thumbBlob.data, { encoding: "image/jpeg" })
      return {
        $type: "app.bsky.embed.external",
        external: {
          uri: song.link,
          title: ytRes.data.title,
          description: ytRes.data.title,
          thumb: data.blob
        }
      }
    }
  } catch(e) {
    console.error(`Error making embed: ${e}`);
  }
}

export async function postSongToBsky(agent: AtpAgent, song: SongDocument) {
  try {
    if (song.track_title) {
      const rt = new RichText({ 
        text: `#nowplaying\n\n${song.track_title}\n\nStreaming live on greattunes.net.`,
      });
      await rt.detectFacets(agent);
      const embed = await makeEmbed(song, agent);
      await agent.post({
        text: rt.text,
        facets: rt.facets,
        embed
      });
    }
  } catch(e) {
    console.error(`Error posting song to Blueksy: ${e}`);
  }
}

