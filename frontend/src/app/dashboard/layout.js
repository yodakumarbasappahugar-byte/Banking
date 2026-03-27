'use client';

import { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const mockNotifs = [
    { id: 1, title: 'Transfer Successful', msg: 'You sent $200.00 to alex@test.com', time: '2m ago' },
    { id: 2, title: 'Security Alert', msg: 'New login detected from Mumbai, IN', time: '1h ago' },
    { id: 3, title: 'System Update', msg: 'Dashboard v1.2 is now live with Users view', time: 'Yesterday' }
  ];

  const handleLogout = (e) => {
    e?.preventDefault();
    localStorage.removeItem('user');
    router.push('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const toggleNotifs = (e) => {
    e.stopPropagation();
    setIsNotifOpen(!isNotifOpen);
    setIsProfileOpen(false);
  };

  const toggleProfile = (e) => {
    e.stopPropagation();
    setIsProfileOpen(!isProfileOpen);
    setIsNotifOpen(false);
  };

  // Close trays on outside click
  useEffect(() => {
    const closeTrays = () => {
      setIsNotifOpen(false);
      setIsProfileOpen(false);
    };
    window.addEventListener('click', closeTrays);
    return () => window.removeEventListener('click', closeTrays);
  }, []);

  return (
    <div className={styles.wrapper}>
      {/* Sidebar Overlay - only for mobile sidebar, no blur for trays */}
      {isSidebarOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>N</div>
          <span>NidhiBank</span>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/dashboard" className={pathname === '/dashboard' ? styles.navLinkActive : styles.navLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>Overview</span>
          </Link>
          <div className={styles.navLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Security</span>
          </div>
          <div className={styles.navLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span>My Cards</span>
          </div>
          <Link href="/dashboard/users" className={pathname === '/dashboard/users' ? styles.navLinkActive : styles.navLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Users</span>
          </Link>
        </nav>
        
        <div className={styles.sidebarFooter}>
          <a href="#" onClick={handleLogout} className={styles.logoutBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Top Header */}
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          
          <div className={styles.searchBar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search transactions..." />
          </div>
          
          <div className={styles.userProfile}>
            <div className={`${styles.notifications} ${isNotifOpen ? styles.activeIcon : ''}`} onClick={toggleNotifs} style={{ cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className={styles.notifBadge}></span>
              
              {/* Notification Tray */}
              {isNotifOpen && (
                <div className={styles.notifTray} onClick={(e) => e.stopPropagation()}>
                   <div className={styles.trayHeader}>Notifications</div>
                   <div className={styles.trayBody}>
                      {mockNotifs.map(n => (
                        <div key={n.id} className={styles.notifItem}>
                           <div className={styles.notifTitle}>{n.title}</div>
                           <div className={styles.notifMsg}>{n.msg}</div>
                           <div className={styles.notifTime}>{n.time}</div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div 
              className={`${styles.avatarContainer} ${isProfileOpen ? styles.activeIcon : ''}`} 
              onClick={toggleProfile}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <div className={styles.avatar}>{user?.email ? user.email[0].toUpperCase() : 'U'}</div>
              
              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className={styles.profileTray} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.profileHeader}>
                    <span className={styles.profileEmail}>{user?.email || 'User Account'}</span>
                    <span className={styles.profileId}>User ID: #00{user?.id || '---'}</span>
                  </div>
                  <div className={styles.trayBody}>
                    <div className={styles.trayItem}>My Profile</div>
                    <div className={styles.trayItem}>Settings</div>
                    <div className={`${styles.trayItem} ${styles.logoutItem}`} onClick={handleLogout}>
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                       <span>Logout</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
