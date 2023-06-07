import { Header } from '@/components/Header'
import styles from '@/styles/PageWrapper.module.css'
import Head from 'next/head'

interface props {
  children: JSX.Element | JSX.Element[];
};

export function PageWrapper({
  children
}: props): JSX.Element{
  return(
    <>
      <Head>
        <title>Great Tunes Radio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main id={styles.root}>
        <div className={styles.App}>
          <Header/>
          <img 
            className={styles.backgroundImg}
            src='/gt-logo-clear-blur.png'
          />
          <div className={styles.mainContentContainer}>
            { children }
          </div>
        </div>
      </main>
    </>
  );
};
