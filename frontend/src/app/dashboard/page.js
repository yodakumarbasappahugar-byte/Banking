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
  const [isAdmin, setIsAdmin] = useState(false);
  const [summary, setSummary] = useState({ balance: 0, transactions: [] });
  const [branchStats, setBranchStats] = useState({ total_users: 0, total_balance: 0, transactions_today: 0, recent_transactions: [] });
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
    const adminMode = parsedUser.role === 'admin' || parsedUser.email === 'nidhi.sharma@nidhi.bank';
    setIsAdmin(adminMode);
    
    if (adminMode) {
      fetchBranchStats();
    } else {
      fetchSummary(parsedUser.id);
    }
  }, []);

  const fetchBranchStats = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/branch-stats`);
      if (res.ok) {
        const data = await res.json();
        setBranchStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch branch stats", err);
    } finally {
      setLoading(false);
    }
  };

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

      // Dispatch event for real-time tray notification (Silent)
      window.dispatchEvent(new CustomEvent('new-transaction', {
        detail: {
          type: 'DEBIT',
          amount: parseFloat(amount),
          message: `Sent ₹${parseFloat(amount).toLocaleString('en-IN')} to ${receiverEmail}`
        }
      }));
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
        {isAdmin ? (
          <>
            <div className={`${styles.statCard} ${styles.adminCard}`}>
              <span className={styles.cardLabel}>Total Branch Assets</span>
              <span className={styles.cardValue}>₹{branchStats.total_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className={styles.adminTag}>Branch Head View</span>
            </div>
            <div className={`${styles.statCard} ${styles.adminCard}`}>
              <span className={styles.cardLabel}>Active Members</span>
              <span className={styles.cardValue}>{branchStats.total_users} People</span>
              <span className={styles.adminTag}>Growth: +2 new this week</span>
            </div>
            <div className={`${styles.statCard} ${styles.adminCard}`}>
              <span className={styles.cardLabel}>Transactions Today</span>
              <span className={styles.cardValue}>{branchStats.transactions_today}</span>
              <span className={styles.adminTag}>System Online</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.statCard}>
              <span className={styles.cardLabel}>Total Balance</span>
              <span className={styles.cardValue}>₹{summary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className={styles.cardTrend}>+2.4% from last month</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.cardLabel}>Monthly Income</span>
              <span className={styles.cardValue}>₹12,400.00</span>
              <span className={styles.cardTrend}>+4.1% from last month</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.cardLabel}>Monthly Expenses</span>
              <span className={styles.cardValue}>₹3,842.12</span>
              <span className={styles.cardTrend} style={{ color: '#f87171' }}>-1.2% from last month</span>
            </div>
          </>
        )}
      </div>

      <div className={styles.mainGrid}>
        {/* Recent Transactions / Global Activity */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>{isAdmin ? 'Global Branch Activity' : 'Recent Transactions'}</span>
            <button className={styles.viewAll} onClick={() => router.push(isAdmin ? '/dashboard/users' : '/dashboard')}>View all</button>
          </div>
          
          <div className={styles.transList}>
            {isAdmin ? (
              branchStats.recent_transactions.length > 0 ? (
                branchStats.recent_transactions.map((t) => (
                  <TransactionItem 
                    key={t.id}
                    name={`From: ${t.sender_name} To: ${t.receiver_name}`}
                    date={new Date(t.created_at).toLocaleDateString()} 
                    amount={`₹${t.amount.toLocaleString('en-IN')}`}
                    positive={true}
                    isAdmin={true}
                  />
                ))
              ) : <p className={styles.noData}>No global activity logged</p>
            ) : (
              (summary.transactions || []).length > 0 ? (
                summary.transactions.map((t) => (
                  <TransactionItem 
                    key={t.id}
                    name={t.sender_id === user.id ? `To: ${t.receiver_email}` : `From: ${t.sender_email}`}
                    date={new Date(t.created_at).toLocaleDateString()} 
                    amount={t.sender_id === user.id ? `-₹${t.amount.toLocaleString('en-IN')}` : `+₹${t.amount.toLocaleString('en-IN')}`}
                    positive={t.sender_id !== user.id}
                  />
                ))
              ) : <p className={styles.noData}>No recent transactions</p>
            )}
          </div>
        </div>

        {/* Action Center */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>{isAdmin ? 'Branch Head Controls' : 'Quick Transfer'}</div>
          {isAdmin ? (
            <div className={styles.adminActionBox}>
              <p className={styles.adminHint}>As Branch Head, you can manage all users and transactions from the "Branch Management" portal.</p>
              <button className={styles.manageBtn} onClick={() => router.push('/dashboard/users')}>
                Go to Management Portal
              </button>
              <div className={styles.systemStatus}>
                <div className={styles.statusDot}></div>
                <span>Server Status: Operational</span>
              </div>
            </div>
          ) : (
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
                <label>Amount (₹)</label>
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
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ name, date, amount, positive, isAdmin }) {
  return (
    <div className={styles.transItem}>
      <div className={styles.transInfo}>
        <div className={`${styles.transIcon} ${isAdmin ? styles.adminIcon : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isAdmin ? (
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            ) : (
                <>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                </>
            )}
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
