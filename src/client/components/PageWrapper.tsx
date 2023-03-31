import { Header } from '@/components/Header'
import styles from '@/styles/Home.module.css'
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
          <div className={styles.mainContentContainer}>
            { children }
          </div>
        </div>
      </main>
    </>
  );
};