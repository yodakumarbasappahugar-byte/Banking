'use client';

import { useState, useEffect } from 'react';
import styles from './security.module.css';

const EyeIcon = ({ visible }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </>
    )}
  </svg>
);

export default function SecurityPage() {
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [activityList, setActivityList] = useState([]);

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRealLocation = async () => {
      try {
        // Try to fetch location with a 3-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('IP service rate limited or unavailable');
        
        const data = await res.json();
        
        const loc = data.city && data.country_name 
            ? `${data.city}, ${data.country_name}` 
            : 'Mumbai, India'; // Default fallback if data is missing
        
        // Very basic User Agent parsing
        const ua = navigator.userAgent;
        let browser = "Unknown Browser";
        let os = "Unknown OS";
        
        if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Edg")) browser = "Edge";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        
        if (ua.includes("Win")) os = "Windows";
        else if (ua.includes("Mac")) os = "MacOS";
        else if (ua.includes("Linux")) os = "Linux";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
        
        const deviceStr = `${browser} / ${os}`;
        
        setActivityList([
          { id: 1, event: 'Current Login Session', device: deviceStr, location: loc, time: 'Just now', status: 'success' },
          { id: 2, event: 'Transfer', device: deviceStr, location: loc, time: '2h ago', status: 'success' },
          { id: 3, event: 'Settings Change', device: deviceStr, location: loc, time: '1 day ago', status: 'success' }
        ]);
      } catch (err) {
        console.warn("Location fetch skipped:", err.message);
        // Silently fallback to a default location instead of showing a console error or crashing
        setActivityList([
          { id: 1, event: 'Current Login Session', device: 'Chrome / Windows', location: 'Mumbai, India', time: 'Just now', status: 'success' },
          { id: 2, event: 'Transfer', device: 'Chrome / Windows', location: 'Mumbai, India', time: '2h ago', status: 'success' },
          { id: 3, event: 'Settings Change', device: 'Chrome / Windows', location: 'Mumbai, India', time: '1 day ago', status: 'success' }
        ]);
      }
    };
    
    fetchRealLocation();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    if (passwordData.new.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error("No user session found");
      const user = JSON.parse(userStr);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://banking-backend-api.onrender.com';
      const res = await fetch(`${backendUrl}/api/auth/password/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          current_password: passwordData.current,
          new_password: passwordData.new
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update password');
      }

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score < 3) return { label: 'Weak', color: '#ef4444', width: '33%' };
    if (score < 5) return { label: 'Medium', color: '#eab308', width: '66%' };
    return { label: 'Strong', color: '#10b981', width: '100%' };
  };
  const strength = getStrength(passwordData.new);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Security Center</h1>
          <p className={styles.subtitle}>Manage your account protection and monitoring</p>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Change Password</h3>
          <form className={styles.form} onSubmit={handlePasswordChange}>
            <div className={styles.inputGroup}>
              <label>Current Password</label>
              <div className={styles.inputWrapper}>
                <input 
                  type={showPasswords.current ? "text" : "password"} 
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  placeholder="••••••••" 
                  required 
                />
                <button type="button" className={styles.eyeBtn} onClick={() => togglePasswordVisibility('current')} title={showPasswords.current ? "Hide password" : "Show password"}>
                  <EyeIcon visible={showPasswords.current} />
                </button>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>New Password</label>
              <div className={styles.inputWrapper}>
                <input 
                  type={showPasswords.new ? "text" : "password"} 
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  placeholder="••••••••" 
                  required 
                />
                <button type="button" className={styles.eyeBtn} onClick={() => togglePasswordVisibility('new')} title={showPasswords.new ? "Hide password" : "Show password"}>
                  <EyeIcon visible={showPasswords.new} />
                </button>
              </div>
              {passwordData.new && (
                <div className={styles.strengthContainer}>
                  <div className={styles.strengthTrack}>
                    <div className={styles.strengthFill} style={{ width: strength.width, backgroundColor: strength.color }}></div>
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label>Confirm New Password</label>
              <div className={styles.inputWrapper}>
                <input 
                  type={showPasswords.confirm ? "text" : "password"} 
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  placeholder="••••••••" 
                  required 
                />
                <button type="button" className={styles.eyeBtn} onClick={() => togglePasswordVisibility('confirm')} title={showPasswords.confirm ? "Hide password" : "Show password"}>
                  <EyeIcon visible={showPasswords.confirm} />
                </button>
              </div>
            </div>
            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}
            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className={styles.twoFactorContainer}>
            <div className={styles.twoFactor}>
              <div className={styles.tfaInfo}>
                <h4 className={styles.tfaTitle}>Two-Factor Authentication (2FA)</h4>
                <p className={styles.tfaDesc}>Add an extra layer of security to your account.</p>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" checked={is2FAEnabled} onChange={() => setIs2FAEnabled(!is2FAEnabled)} />
                <span className={styles.slider}></span>
              </label>
            </div>
            
            <div className={styles.tfaAction}>
              <button className={styles.setupTfaBtn}>Setup 2FA</button>
              <p className={styles.tfaSmallText}>Use OTP or Authenticator App</p>
            </div>
          </div>

          <div className={styles.alertsContainer}>
            <div className={styles.tfaInfo}>
              <h4 className={styles.tfaTitle}>Security Alerts</h4>
            </div>
            <div className={styles.alertsList}>
              <label className={styles.checkLabel}>
                <input type="checkbox" defaultChecked className={styles.checkInput} />
                <span className={styles.checkText}>Notify on new login</span>
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" defaultChecked className={styles.checkInput} />
                <span className={styles.checkText}>Notify on password change</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Security Activity</h3>
          <div className={styles.activityList}>
            {activityList.length === 0 ? (
              <p style={{color: '#94a3b8', fontSize: '13px'}}>Loading security logs...</p>
            ) : activityList.map(act => (
              <div key={act.id} className={styles.activityItem}>
                <div className={`${styles.statusDot} ${styles[act.status]}`}></div>
                <div className={styles.activityContent}>
                  <div className={styles.activityHeader}>
                    <span className={styles.event}>{act.event}</span>
                    <span className={styles.time}>{act.time}</span>
                  </div>
                  <div className={styles.activityMeta}>
                    <span>{act.device}</span>
                    <span>•</span>
                    <span>{act.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className={styles.viewAllBtn}>View All Activity</button>
        </div>
      </div>
    </div>
  );
}
