'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo_container}>
        <Image src="/logo.png" alt="NidhiBank Logo" width={40} height={40} className={styles.logo_img} />
        <span className={styles.brand_name}>NidhiBank</span>
      </Link>

      <div className={styles.nav_actions}>
        <Link href="/login" className={styles.nav_login_btn}>Log in</Link>
        <Link href="/signup" className={styles.nav_signup_btn}>Get Started</Link>
      </div>
    </nav>
  );
}

