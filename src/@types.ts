export interface songInfo{
  title: string;
  memberPosted: string;
  postText: string;
  datePosted: string; //TODO: is this the right type for a date? date obj maybe?
  src: string;
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
