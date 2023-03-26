export interface songInfo{
  title: string;
  memberPosted: string | undefined;
  postText: string | undefined;
  datePosted: Date | undefined;
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

export interface chatMessage{
  userId: string;
  message: string;
  timeStamp: Date;
}
