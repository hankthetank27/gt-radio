import { post } from '../../@types';
import styles from '@/styles/PostSearch.module.css';
import ytdl from 'ytdl-core';
import { Dispatch, SetStateAction, useState } from 'react';


interface postProps {
post: post
};

export function Post({
  post
}: postProps): JSX.Element{
  return (
    <div className={styles.post}>
      <ul className={styles.postList}>
        {post.track_title 
          ? <li className={styles.postTitle}>{post.track_title}</li> 
          : null 
        }
        {post.link && post.link_source 
          ? <li>
              <MediaEmbed
                mediaSrc={post.link_source}
                src={post.link}
              />
            </li> 
          : null
        }
        <li>Posted by {post.user_name}</li>
        <li>{new Date(post.date_posted).toDateString()}</li>
        {post.text 
          ? <li className={styles.postText}>"{post.text}"</li> 
          : null 
        }
      </ul>
    </div>
  );
};


interface embedIframeProps{
  mediaSrc: string
  src: string
};

function MediaEmbed({
  mediaSrc,
  src,
}: embedIframeProps): JSX.Element{

  const [ pressedPlay, setPressedPlay ] = useState<boolean>(false);

  switch (mediaSrc){
    case('youtube'):
      try {
        const videoId = ytdl.getURLVideoID(src);
        return (
          <div className={styles.youtube_player}>
            {!pressedPlay
              ? <PlaceHolderImg
                  videoId={videoId}
                  setPressedPlay={setPressedPlay}
                />
              : <EmbedIframe
                  videoId={videoId}
                  src={src}
                />
            }
          </div>
        );
      } catch (err){
        return <div><a href={src} target='_blank'>Youtube</a></div>;
      };
    case('bandcamp'):
      return (
        <div>
          <a href={src} target='_blank'>Bandcamp</a>
        </div>
      );
    case('soundcloud'):
      return (
        <div>
          <a href={src} target='_blank'>Soundcloud</a>
        </div>
      );
    default:
      return (
        <div>
          <a href={src} target='_blank'>{src}</a>
        </div>
      );
  };
};


interface embedProps{
  videoId: string  
  src: string
};

function EmbedIframe({
  videoId,
  src
}: embedProps): JSX.Element{
  return (
    <iframe
      width="500"
      height="280"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    >
      <a href={src}>Youtube</a>
    </iframe>
  );
};


interface placeHolderImgProps{
  videoId: string
  setPressedPlay: Dispatch<SetStateAction<boolean>>
};

function PlaceHolderImg({
  videoId,
  setPressedPlay
}: placeHolderImgProps): JSX.Element{
  return (
    <div>
      <img 
        src={"https://i.ytimg.com/vi/ID/hqdefault.jpg".replace("ID", videoId)}>
      </img>
      <button 
        className={ styles.play }
        onClick={() => setPressedPlay(true)}
      />
    </div>
  );
};

