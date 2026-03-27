'use client';

import { useState, useEffect } from 'react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [user, setUser] = useState({ full_name: '', email: '', mobile_number: '', id: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleUpdate = (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem('user', JSON.stringify(user));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
      // Update event for layout to sync
      window.dispatchEvent(new Event('storage'));
    }, 1000);
  };

  if (loading) return <div className={styles.loading}>Loading settings...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Account Settings</h1>
          <p className={styles.subtitle}>Update your personal information and profile preferences</p>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarLarge}>
               {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{user.full_name || 'User'}</h2>
              <p className={styles.profileEmail}>{user.email}</p>
              <div className={styles.badge}>Verified Account</div>
            </div>
          </div>
          
          <div className={styles.profileStats}>
            <div className={styles.statItem}>
              <span>Account Type</span>
              <strong>Premium Savings</strong>
            </div>
            <div className={styles.statItem}>
              <span>Member Since</span>
              <strong>March 2026</strong>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <form className={styles.form} onSubmit={handleUpdate}>
            <h3 className={styles.formTitle}>Personal Information</h3>
            
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input 
                type="text" 
                value={user.full_name} 
                onChange={(e) => setUser({...user, full_name: e.target.value})}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Mobile Number</label>
              <input 
                type="tel" 
                value={user.mobile_number} 
                onChange={(e) => setUser({...user, mobile_number: e.target.value})}
                placeholder="Enter mobile number"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Email Address (Read-only)</label>
              <input 
                type="email" 
                value={user.email} 
                disabled 
                className={styles.disabledInput}
              />
              <p className={styles.inputHint}>Email cannot be changed for security reasons.</p>
            </div>

            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
