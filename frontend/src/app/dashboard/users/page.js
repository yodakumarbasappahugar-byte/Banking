'use client';

import { useState, useEffect } from 'react';
import styles from './users.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://banking-backend-api.onrender.com';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.mobile_number.includes(search)
  );

  if (loading) {
    return <div className={styles.loading}>Loading secure user data...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>View and manage all registered NidhiBank members</p>
        </div>
        <div className={styles.searchBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            placeholder="Search email or mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.userList}>
        <div className={styles.tableHeader}>
           <span>User</span>
           <span className={styles.hideMobile}>Mobile</span>
           <span>Balance</span>
           <span className={styles.hideMobile}>Joined</span>
        </div>
        
        {filteredUsers.map(u => (
          <div key={u.id} className={styles.userRow}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>{u.email[0].toUpperCase()}</div>
              <div className={styles.details}>
                <span className={styles.email}>{u.email}</span>
                <span className={styles.id}>ID: #00{u.id}</span>
                <span className={styles.showMobile}>{u.mobile_number}</span>
              </div>
            </div>
            
            <span className={`${styles.mobileNumber} ${styles.hideMobile}`}>{u.mobile_number}</span>
            <span className={styles.balance}>${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className={`${styles.joinedDate} ${styles.hideMobile}`}>{new Date(u.created_at).toLocaleDateString()}</span>
          </div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className={styles.noResults}>No members found matching "{search}"</div>
        )}
      </div>
    </div>
  );
}
