export interface songInfo{
  src: string;
  title: string;
  duration: string;
  channel: string;
  itag: number;
  length: number;
};

export interface streamProcessTracker {
  startTime: number;
  downloaded: number;
  processed: number;
  passThroughFlowing: boolean;
  ytdlDone: boolean;
  transcodeAudioDone: boolean;
  passToDestinationDone: boolean;
};
