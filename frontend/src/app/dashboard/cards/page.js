'use client';

import { useState, useEffect } from 'react';
import styles from './cards.module.css';

export default function CardsPage() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Initialize with a default card based on user ID
      const defaultCard = {
        id: 1,
        number: `4400 ${parsedUser.id.toString().padStart(4, '0')} ${parsedUser.id.toString().padStart(4, '0')} 9988`,
        exp: '12/28',
        cvv: '123',
        brand: 'VISA',
        isFrozen: false,
        name: parsedUser.full_name || 'Nidhi Member'
      };
      setCards([defaultCard]);
    }
  }, []);

  const handleAddCard = () => {
    const newId = cards.length + 1;
    const newCard = {
      id: newId,
      number: `5200 ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)} ${Math.floor(Math.random() * 9000 + 1000)}`,
      exp: '06/30',
      cvv: Math.floor(Math.random() * 900 + 100).toString(),
      brand: newId % 2 === 0 ? 'MASTERCARD' : 'VISA',
      isFrozen: false,
      name: user?.full_name || 'Nidhi Member'
    };
    setCards([...cards, newCard]);
    setActiveCardIndex(cards.length); // Switch to the new card
    alert("New virtual card generated successfully!");
  };

  const toggleFreeze = () => {
    const updatedCards = [...cards];
    updatedCards[activeCardIndex].isFrozen = !updatedCards[activeCardIndex].isFrozen;
    setCards(updatedCards);
  };

  const currentCard = cards[activeCardIndex];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Cards</h1>
          <p className={styles.subtitle}>Manage your {cards.length} virtual NidhiBank cards</p>
        </div>
        <button className={styles.addCardBtn} onClick={handleAddCard}>+ Add New Card</button>
      </header>

      {cards.length > 1 && (
        <div className={styles.cardSelector}>
          {cards.map((c, i) => (
            <button 
              key={c.id} 
              className={`${styles.selectorBtn} ${activeCardIndex === i ? styles.activeSelector : ''}`}
              onClick={() => { setActiveCardIndex(i); setShowFullDetails(false); }}
            >
              Card {c.id} ({c.brand})
            </button>
          ))}
        </div>
      )}

      {currentCard && (
        <div className={styles.grid}>
          <div className={styles.cardSection}>
            <div className={`${styles.virtualCard} ${currentCard.isFrozen ? styles.frozen : ''} ${currentCard.brand === 'MASTERCARD' ? styles.mastercardBg : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.bankName}>NidhiBank</div>
                <div className={styles.chip}></div>
              </div>
              
              <div className={styles.cardInfo}>
                <div className={styles.cardNumber}>
                  {showFullDetails ? currentCard.number : `•••• •••• •••• ${currentCard.number.slice(-4)}`}
                </div>
                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <span>HOLDER NAME</span>
                    <div className={styles.val}>{currentCard.name}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <span>EXPIRY</span>
                    <div className={styles.val}>{currentCard.exp}</div>
                  </div>
                  {showFullDetails && (
                    <div className={styles.metaItem}>
                      <span>CVV</span>
                      <div className={styles.val}>{currentCard.cvv}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardBrand}>{currentCard.brand}</div>
            </div>

            <div className={styles.cardActions}>
              <button className={styles.actionBtn} onClick={() => setShowFullDetails(!showFullDetails)}>
                {showFullDetails ? 'Hide Details' : 'Show Card Details'}
              </button>
              <button className={`${styles.actionBtn} ${currentCard.isFrozen ? styles.unfreeze : styles.freeze}`} onClick={toggleFreeze}>
                {currentCard.isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
              </button>
            </div>
          </div>

          <div className={styles.settingsSection}>
            <h3 className={styles.sectionTitle}>Card Settings (Card #{currentCard.id})</h3>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingName}>Online Transactions</div>
                <div className={styles.settingDesc}>Enable/Disable internet payments</div>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingName}>International Usage</div>
                <div className={styles.settingDesc}>Enable/Disable payments outside India</div>
              </div>
               <label className={styles.switch}>
                <input type="checkbox" />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingName}>Contactless Payments</div>
                <div className={styles.settingDesc}>Enable tap-to-pay via NFC</div>
              </div>
               <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.limitBox}>
              <div className={styles.limitHeader}>
                <span>Daily Transaction Limit</span>
                <span>₹2,50,000</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
