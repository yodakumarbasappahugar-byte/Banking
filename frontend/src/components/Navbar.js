import Link from 'next/link';
import Image from 'next/image';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo_container}>
        <Image src="/logo.png" alt="NidhiBank Logo" width={50} height={50} className={styles.logo_img} />
        <span className={styles.brand_name}>NidhiBank</span>
      </Link>
    </nav>
  );
}
