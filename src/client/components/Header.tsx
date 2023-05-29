import styles from '@/styles/PageWrapper.module.css';
import Link from 'next/link';

export function Header(): JSX.Element{
  return (
    <div className={styles.headerContainer}>
      <div className={styles.navbar}>
        <Link href='/'>Radio</Link>
        <Link href='/explore-archive'>Explore Archive</Link>
        <Link href='/about'>About</Link>
      </div>
    </div>
  );
};
