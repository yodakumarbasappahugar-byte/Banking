'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo_container}>
        <Image src="/logo.png" alt="NidhiBank Logo" width={40} height={40} className={styles.logo_img} />
        <span className={styles.brand_name}>NidhiBank</span>
      </Link>

      {/* Hamburger Menu Toggle */}
      <button className={styles.hamburger} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>

      <div className={`${styles.nav_links} ${isOpen ? styles.nav_links_mobile : ''}`}>
        <Link href="#features" onClick={() => setIsOpen(false)}>Features</Link>
        <Link href="#about" onClick={() => setIsOpen(false)}>About</Link>
        <Link href="#help" onClick={() => setIsOpen(false)}>Help Center</Link>
        
        <div className={styles.nav_actions_mobile}>
          <Link href="/login" onClick={() => setIsOpen(false)} className={styles.nav_login_btn}>Log in</Link>
          <Link href="/signup" onClick={() => setIsOpen(false)} className={styles.nav_signup_btn}>Get Started</Link>
        </div>
      </div>

      <div className={styles.nav_actions}>
        <Link href="/login" className={styles.nav_login_btn}>Log in</Link>
        <Link href="/signup" className={styles.nav_signup_btn}>Get Started</Link>
      </div>
    </nav>
  );
}
