'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './users.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    password: '',
    balance: 0,
    role: 'user'
  });
  const [formLoading, setFormLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://banking-backend-api.onrender.com';

  const router = useRouter();

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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      if (u.role !== 'admin' && u.email !== 'nidhi.sharma@nidhi.bank') {
        router.push('/dashboard');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.mobile_number && u.mobile_number.includes(search))
  );

  const handleOpenModal = (user = null) => {
    if (user) {
      setIsEditing(true);
      setCurrentUser(user);
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        mobile_number: user.mobile_number || '',
        password: '', // Don't show password on edit
        balance: user.balance || 0,
        role: user.role || 'user'
      });
    } else {
      setIsEditing(false);
      setCurrentUser(null);
      setFormData({
        full_name: '',
        email: '',
        mobile_number: '',
        password: '',
        balance: 0,
        role: 'user'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      full_name: '',
      email: '',
      mobile_number: '',
      password: '',
      balance: 0,
      role: 'user'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = isEditing 
        ? `${backendUrl}/api/users/${currentUser.id}` 
        : `${backendUrl}/api/users`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchUsers();
        handleCloseModal();
        alert(isEditing ? "User updated successfully!" : "User created successfully!");
      } else {
        const error = await res.json();
        alert(`Error: ${error.detail || "Operation failed"}`);
      }
    } catch (err) {
      console.error("CRUD Error:", err);
      alert("Failed to connect to the server");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This will also remove all their transactions permanently.")) return;
    
    try {
      const res = await fetch(`${backendUrl}/api/users/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        alert("User deleted successfully!");
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to connect to the server");
    }
  };

  const getMockAccNo = (id) => `8899${id.toString().padStart(8, '0')}`;
  const mockIFSC = 'NB0001';

  if (loading) {
    return <div className={styles.loading}>Loading secure user data...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Branch Membership Directory</h1>
          <h2 className={styles.adminCounter}>Total Members: {users.length}</h2>
          <p className={styles.subtitle}>Manage and monitor all NidhiBank branch accounts</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
             <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.addBtn} onClick={() => handleOpenModal()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        </div>
      </header>

      <div className={styles.userList}>
        <div className={styles.tableHeader}>
           <span className={styles.colName}>Account Holder</span>
           <span className={`${styles.colAcc} ${styles.hideMobile}`}>Account Number</span>
           <span className={`${styles.colIfsc} ${styles.hideTablet}`}>IFSC</span>
           <span className={styles.colBalance}>Balance</span>
           <span className={`${styles.colJoined} ${styles.hideMobile}`}>Joined</span>
           <span className={styles.colRole}>Role</span>
           <span className={styles.colActions}>Actions</span>
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
              <span className={styles.balance}>₹{u.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className={`${styles.joinedDetails} ${styles.colJoined} ${styles.hideMobile}`}>
               <span className={styles.joinedDate}>{new Date(u.created_at).toLocaleDateString()}</span>
            </div>

            <div className={styles.colRole}>
              <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.adminBadge : styles.userBadge}`}>
                {u.role.toUpperCase()}
              </span>
            </div>

            <div className={styles.actionBtns}>
              <button 
                className={`${styles.iconBtn} ${styles.editBtn}`} 
                onClick={() => handleOpenModal(u)}
                title="Edit User"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button 
                className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                onClick={() => handleDelete(u.id)}
                title="Delete User"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        ))}
        
        {filteredUsers.length === 0 && (
          <div className={styles.noResults}>No members found matching "{search}"</div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{isEditing ? 'Edit User' : 'Add New User'}</h2>
              <p className={styles.modalSubtitle}>
                {isEditing ? 'Update NidhiBank member information' : 'Create a new secure bank account'}
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Mobile Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                  />
                </div>
                {!isEditing && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Initial Password</label>
                    <input 
                      type="password" 
                      required 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                )}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Balance (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: e.target.value})}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>User Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? 'Processing...' : (isEditing ? 'Save Changes' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
