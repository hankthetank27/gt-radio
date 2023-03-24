export function configNms(ffmpegPath: string){
  const config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: false,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        mediaroot: './media',
        allow_origin: '*'
    },
    trans: {
      ffmpeg: ffmpegPath,
      tasks: [
        {
          app: 'live',
          hls: true,
          hlsFlags: '[hls_time=3:hls_list_size=3:hls_flags=delete_segments]',
          hlsKeep: false
        }
      ]
    },
    mediaServer: {
      idleTimeout: 120
    }
  };
  return config;
};