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
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.mobile_number.includes(search)
  );

  const getMockAccNo = (id) => `8899${id.toString().padStart(8, '0')}`;
  const mockIFSC = 'NB0001';

  if (loading) {
    return <div className={styles.loading}>Loading secure user data...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Register and manage all NidhiBank member accounts</p>
        </div>
        <div className={styles.searchBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
           <input 
            type="text" 
            placeholder="Search name, email or mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.userList}>
        <div className={styles.tableHeader}>
           <span className={styles.colName}>Account Holder</span>
           <span className={`${styles.colAcc} ${styles.hideMobile}`}>Account Number</span>
           <span className={`${styles.colIfsc} ${styles.hideTablet}`}>IFSC</span>
           <span className={styles.colBalance}>Balance</span>
           <span className={`${styles.colJoined} ${styles.hideMobile}`}>Joined</span>
        </div>
        
        {filteredUsers.map(u => (
          <div key={u.id} className={styles.userRow}>
            <div className={`${styles.userInfo} ${styles.colName}`}>
              <div className={styles.avatar}>{u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}</div>
              <div className={styles.details}>
                <span className={styles.fullName}>{u.full_name || 'Global User'}</span>
                <span className={styles.email}>{u.email}</span>
              </div>
            </div>
            
            <div className={`${styles.accDetails} ${styles.colAcc} ${styles.hideMobile}`}>
              <span className={styles.accNo}>{getMockAccNo(u.id)}</span>
            </div>

            <div className={`${styles.ifscDetails} ${styles.colIfsc} ${styles.hideTablet}`}>
              <span className={styles.ifsc}>{mockIFSC}</span>
            </div>

            <div className={`${styles.balanceDetails} ${styles.colBalance}`}>
              <span className={styles.balance}>${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className={`${styles.joinedDetails} ${styles.colJoined} ${styles.hideMobile}`}>
               <span className={styles.joinedDate}>{new Date(u.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className={styles.noResults}>No members found matching "{search}"</div>
        )}
      </div>
    </div>
  );
}
