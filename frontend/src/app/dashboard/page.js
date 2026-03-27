'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading Overview...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  
  // Transfer Form State
  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://banking-backend-api.onrender.com';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchSummary(parsedUser.id);
  }, []);

  const fetchSummary = async (userId) => {
    try {
      const res = await fetch(`${backendUrl}/api/dashboard/summary/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMoney = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ text: 'Please enter a valid amount', type: 'error' });
      return;
    }

    setIsTransferring(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch(`${backendUrl}/api/transactions/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_email: receiverEmail,
          amount: parseFloat(amount),
          description: `Transfer to ${receiverEmail}`
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Transfer failed');
      }

      setMessage({ text: 'Transfer Successful!', type: 'success' });
      setReceiverEmail('');
      setAmount('');
      // Refresh summary
      fetchSummary(user.id);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading your secure dashboard...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.pageTitle}>Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <span className={styles.cardLabel}>Total Balance</span>
          <span className={styles.cardValue}>${summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span className={styles.cardTrend}>+2.4% from last month</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.cardLabel}>Monthly Income</span>
          <span className={styles.cardValue}>$12,400.00</span>
          <span className={styles.cardTrend}>+4.1% from last month</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.cardLabel}>Monthly Expenses</span>
          <span className={styles.cardValue}>$3,842.12</span>
          <span className={styles.cardTrend} style={{ color: '#f87171' }}>-1.2% from last month</span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Recent Transactions */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>Recent Transactions</span>
            <span className={styles.viewAll}>View all</span>
          </div>
          
          <div className={styles.transList}>
            {(summary.transactions || []).filter(t => 
              t.receiver_email?.toLowerCase().includes(query.toLowerCase()) ||
              t.sender_email?.toLowerCase().includes(query.toLowerCase()) ||
              t.amount.toString().includes(query)
            ).length > 0 ? (
              summary.transactions
                .filter(t => 
                  t.receiver_email?.toLowerCase().includes(query.toLowerCase()) ||
                  t.sender_email?.toLowerCase().includes(query.toLowerCase()) ||
                  t.amount.toString().includes(query)
                )
                .map((t) => (
                  <TransactionItem 
                    key={t.id}
                    name={t.sender_id === user.id ? `To: ${t.receiver_email}` : `From: ${t.sender_email}`}
                    date={new Date(t.created_at).toLocaleDateString()} 
                    amount={t.sender_id === user.id ? `-$${t.amount}` : `+$${t.amount}`}
                    positive={t.sender_id !== user.id}
                  />
                ))
            ) : (
              <p className={styles.noData}>
                {query ? `No transactions matching "${query}"` : 'No recent transactions'}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions / Transfer Form */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Quick Transfer</div>
          <form className={styles.transferForm} onSubmit={handleSendMoney}>
            {message.text && (
              <div className={message.type === 'success' ? styles.successMsg : styles.errorMsg}>
                {message.text}
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label>Receiver Email</label>
              <input 
                type="email" 
                placeholder="friend@example.com"
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Amount ($)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className={styles.sendBtn}
              disabled={isTransferring}
            >
              {isTransferring ? 'Processing...' : 'Send Money'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ name, date, amount, positive }) {
  return (
    <div className={styles.transItem}>
      <div className={styles.transInfo}>
        <div className={styles.transIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <div className={styles.transDetails}>
          <span className={styles.transName}>{name}</span>
          <span className={styles.transDate}>{date}</span>
        </div>
      </div>
      <span className={positive ? styles.amountPos : styles.amountNeg}>
        {amount}
      </span>
    </div>
  );
}
