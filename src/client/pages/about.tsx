import { PageWrapper } from "@/components/PageWrapper"
import styles from '@/styles/About.module.css'

export default function About():JSX.Element{
  return(
    <PageWrapper>
      <div className={styles.mainContainer}>
        <p>
          Great Tunes Radio is an archival project, broadcasting and publicly repositing music which was posted in the seminal Great Tunes Facebook group between 2012 - 2023. Driven by the simple and effective goal of sharing great tunes, this group has been widely considered as having a pivotal role in shaping the landscape of music that the true sonic devotee experiences today. A space where sounds of all forms and fervent spirit became intertwined via the vast and twisting networks of the web, Great Tunes became a pseudo-force-of-nature for bonding like minded music addicts across the globe. Although still active to this day, the community has fractured and the group's grown largely quiet as the tides of social media platforms churn along. Still, its influence persists, and the collective intelligence of the community it created has spread its tendtrils expansively, suffusing its unrestrained musical passion into every last crevasse of the underground and overground alike. This site is a tribute to that enthusiastic devotion to discovering and sharing great tunes the members of the community shared with one another.
          </p>
        <p>
           The broadcast livestreams songs at random from the archive. After playing a song which has not previously been aired, the audio link and additional information about the original post will be available to view and listen back to on the archive page, incrementally rolling out each song and post to the public as the radio plays new music.
        </p>
        <p className={styles.disclaimer}>
          <b>GREAT TUNES RADIO IS A BROADCAST ENTITY EXISTING FOR EDUCATIONAL PURPOSES ONLY.</b> It is a continual work in progress, and maintained with love and some free time. New ideas for features, improvements, and bug finds/fixes are welcome, so feel free to open pull request or issue in the project's <a href="https://github.com/hankthetank27/gt-radio"><u>GitHub repository</u></a> if you'd like. If you have any questions, concerns or suggestions please reach out to <a href="mailto:hjackson277@gmail.com"><u>hjackson277@gmail.com</u></a>.
        </p>
      </div>
    </PageWrapper>
  );
};
