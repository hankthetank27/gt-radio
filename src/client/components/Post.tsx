import { post } from '../../@types';
import styles from '@/styles/PostSearch.module.css';
import ytdl from '@distube/ytdl-core';
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
         <li className={styles.postTitle}>
            <a href={post.link} target='_blank'>{post.track_title || post.link}</a>
        </li> 
        {post.link && post.link_source && post.link_source === 'youtube'
          ? <li>
              <YouTubeEmbed
                src={post.link}
              />
            </li> 
          : null
        }
        <li>
          {post.user_name}
          {post.date_posted
            ? <span>
              {", " + new Date(post.date_posted)
                .toDateString()
                .split(' ')
                .slice(1)
                .join(' ')
              }
            </span>
            : null
          }
        </li>
        {post.text 
          ? <li className={styles.postText}>"{post.text}"</li> 
          : null 
        }
      </ul>
    </div>
  );
};


interface embedIframeProps{
  src: string
};

function YouTubeEmbed({
  src,
}: embedIframeProps): JSX.Element | null{

  const [ pressedPlay, setPressedPlay ] = useState<boolean>(false);

  try {
    const videoId = ytdl.getURLVideoID(src);
    return (
      <div className={styles.youtube_player}>
        {!pressedPlay
          ? <PlaceHolderImg
            videoId={videoId}
            setPressedPlay={setPressedPlay}
          />
          : <iframe
            width="500"
            height="280"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          >
            <a href={src}>Youtube</a>
          </iframe>
        }
      </div>
    );
  } catch (err){
    return null;
  };
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

