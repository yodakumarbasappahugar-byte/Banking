'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to NidhiBank', desc: 'Secure your account by enabling 2FA', time: '2m ago', type: 'info', icon: '🏦' },
    { id: 2, title: 'KYC Verified', desc: 'Your account is now fully verified', time: '1h ago', type: 'success', icon: '✅' }
  ]);
  
  const [balance, setBalance] = useState(null);
  
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef(null);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const fetchBalance = async (userId) => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://banking-backend-api.onrender.com'}/api/transactions/summary/${userId}`);
      if (resp.ok) {
        const data = await resp.json();
        setBalance(data.current_balance);
      }
    } catch (e) {
      console.error("Failed to fetch balance for modal", e);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchBalance(u.id);
    } else {
      router.push('/login');
    }

    const handleNewTransaction = (e) => {
      const { type, amount, message } = e.detail;
      const newNotif = {
        id: Date.now(),
        title: type === 'DEBIT' ? 'Transaction Sent' : 'Payment Received',
        desc: message,
        time: 'Just now',
        type: type === 'DEBIT' ? 'warning' : 'success',
        icon: type === 'DEBIT' ? '💸' : '💰',
        isNew: true
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      setNotifOpen(true);
    };

    window.addEventListener('new-transaction', handleNewTransaction);
    window.addEventListener('storage', () => {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    });

    return () => {
      window.removeEventListener('new-transaction', handleNewTransaction);
    };
  }, [router]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/dashboard?q=${encodeURIComponent(search)}`);
  };

  const logout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getMockAccNo = (id) => `8899${id?.toString().padStart(8, '0')}`;
  const mockIFSC = 'NB0001';

  return (
    <div className={styles.layout}>
      {/* Mobile Menu Overlay */}
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarVisible : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>NB</div>
          <span className={styles.logoText}>NidhiBank</span>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={pathname === '/dashboard' ? styles.navLinkActive : styles.navLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>Overview</span>
          </Link>
          <Link href="/dashboard/security" className={pathname === '/dashboard/security' ? styles.navLinkActive : styles.navLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Security</span>
          </Link>
          <Link href="/dashboard/cards" className={pathname === '/dashboard/cards' ? styles.navLinkActive : styles.navLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span>My Cards</span>
          </Link>
          <Link href="/dashboard/users" className={pathname === '/dashboard/users' ? styles.navLinkActive : styles.navLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Users</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <form className={styles.search} onSubmit={handleSearch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className={styles.actions}>
            <div className={styles.iconBtn} onClick={() => { setNotifOpen(!isNotifOpen); setProfileOpen(false); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {notifications.some(n => n.isNew) && <span className={styles.badge} />}
              
              {/* Notification Tray */}
              {isNotifOpen && (
                <div className={styles.tray} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.trayHeader}>
                    <span>Recent Notifications</span>
                    <button className={styles.clearBtn} onClick={() => setNotifications([])}>Clear All</button>
                  </div>
                  <div className={styles.trayContent}>
                    {notifications.length > 0 ? notifications.map(notif => (
                      <div key={notif.id} className={`${styles.trayItem} ${notif.isNew ? styles.itemNew : ''}`}>
                        <div className={styles.trayIcon}>{notif.icon}</div>
                        <div className={styles.trayText}>
                          <div className={styles.trayLabel}>{notif.title}</div>
                          <div className={styles.trayDesc}>{notif.desc}</div>
                          <div className={styles.trayTime}>{notif.time}</div>
                        </div>
                      </div>
                    )) : <div className={styles.noNotif}>No new notifications</div>}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.profile} onClick={() => { setProfileOpen(!isProfileOpen); setNotifOpen(false); }}>
              <div className={styles.avatar}>{user?.full_name ? user.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name || 'User'}</span>
                <span className={styles.userRole}>Premium Account</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isProfileOpen ? styles.chevronUp : ''}><path d="m6 9 6 6 6-6"/></svg>

              {/* Profile Tray */}
              {isProfileOpen && (
                <div className={styles.tray} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.trayItem} onClick={() => { setShowProfileModal(true); setProfileOpen(false); }}>
                    <div className={styles.trayIcon}>🪪</div>
                    <div className={styles.trayText}>
                      <div className={styles.trayLabel}>My Profile</div>
                      <div className={styles.trayDesc}>Account identities</div>
                    </div>
                  </div>
                  <div className={styles.trayItem} onClick={() => { router.push('/dashboard/settings'); setProfileOpen(false); }}>
                    <div className={styles.trayIcon}>⚙️</div>
                    <div className={styles.trayText}>
                      <div className={styles.trayLabel}>Account Settings</div>
                      <div className={styles.trayDesc}>Preferences & Profile</div>
                    </div>
                  </div>
                  <div className={styles.trayDivider} />
                  <div className={`${styles.trayItem} ${styles.logoutItem}`} onClick={logout}>
                    <div className={styles.trayIcon}>🚪</div>
                    <div className={styles.trayText}>
                      <div className={styles.trayLabel}>Logout</div>
                      <div className={styles.trayDesc}>Securely exit session</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Account Identity</h2>
                <button className={styles.closeBtn} onClick={() => setShowProfileModal(false)}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalAvatarContainer}>
                  <div className={styles.modalAvatar}>
                    {user?.full_name ? user.full_name[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                  </div>
                  <div className={styles.modalBalanceBox}>
                    <label>Current Balance</label>
                    <div className={styles.modalBalanceVal}>
                      ₹{balance !== null ? balance.toLocaleString('en-IN') : '...'}
                    </div>
                  </div>
                </div>
                
                <div className={styles.modalSections}>
                  <div className={styles.modalSection}>
                    <label>Full Name</label>
                    <div className={styles.modalFlex}>
                      <div className={styles.modalVal}>{user?.full_name || 'Valued Member'}</div>
                    </div>
                  </div>
                  <div className={styles.modalGrid}>
                     <div className={styles.modalSection}>
                      <label>Account Number</label>
                      <div className={styles.modalFlex}>
                        <div className={styles.mono}>{getMockAccNo(user?.id)}</div>
                        <button className={styles.copyBtn} onClick={() => handleCopy(getMockAccNo(user?.id), 'Account Number')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className={styles.modalSection}>
                      <label>IFSC Code</label>
                      <div className={styles.modalFlex}>
                        <div className={styles.mono}>{mockIFSC}</div>
                        <button className={styles.copyBtn} onClick={() => handleCopy(mockIFSC, 'IFSC Code')}>
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.modalSection}>
                    <label>Email ID</label>
                    <div className={styles.modalVal}>{user?.email}</div>
                  </div>
                  <div className={styles.modalSection}>
                    <label>Member ID</label>
                    <div className={styles.mono}>#NB-{user?.id?.toString().padStart(5, '0')}</div>
                  </div>
                </div>
              </div>
            <div className={styles.modalFooter}>
              <div className={styles.verifiedBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Identity Verified
              </div>
              <button className={styles.modalDoneBtn} onClick={() => setShowProfileModal(false)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
