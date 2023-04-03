import styles from '@/styles/Home.module.css';
import headerImg from '../public/header-image.jpg'
import Link from 'next/link';

export function Header(): JSX.Element{
  return (
    <div className={styles.headerContainer}>
      <img className={styles.headerImg} src={headerImg.src}/>
        <div className={styles.navbar}>
          <Link href='/'>Radio</Link>
          <Link href='/explore-archive'>Explore Archive</Link>
          <Link href='/about'>About</Link>
        </div>
    </div>
  );
};