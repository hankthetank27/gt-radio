import styles from '@/styles/PageWrapper.module.css';
import Link from 'next/link';

export function Header(): JSX.Element{
  return (
    <div className={styles.headerContainer}>
      <div className={styles.navbar}>
        <Link className={styles.pagelink} href='/'>Radio</Link>
        <Link className={styles.pagelink} href='/archive'>Archive</Link>
        <Link className={styles.pagelink} href='/about'>About</Link>
      </div>
    </div>
  );
};
