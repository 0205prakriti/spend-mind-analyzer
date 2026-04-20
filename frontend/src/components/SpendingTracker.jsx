import React, { useEffect, useState } from 'react';
import { get, post } from '../utils/api';

const SpendingTracker = ({ onTransactionAdded }) => {
    const [transactions, setTransactions] = useState([]);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const loadTransactions = async () => {
        try {
            const response = await get('/transactions/');
            setTransactions(response.transactions || []);
        } catch (err) {
            setError(err.message || 'Failed to load transactions');
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const handleAddTransaction = async () => {
        setError('');
        if (amount && description) {
            setLoading(true);
            const newTransaction = {
                amount: parseFloat(amount),
                description,
                category,
                date: new Date(date).toISOString(),
            };
            try {
                await post('/transactions/', newTransaction);
                await loadTransactions();
                if (onTransactionAdded) {
                    onTransactionAdded();
                }
                setAmount('');
                setDescription('');
                setCategory('');
            } catch (err) {
                setError(err.message || 'Failed to add transaction');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div>
            <h2>Spending Tracker</h2>
            <div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                />
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                />
                <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category (optional)"
                />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <button onClick={handleAddTransaction} disabled={loading}>
                    {loading ? 'Saving...' : 'Add Transaction'}
                </button>
            </div>
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            <h3>Transaction History</h3>
            <ul>
                {transactions.map((transaction, idx) => (
                    <li key={`${transaction.date}-${transaction.amount}-${idx}`}>
                        <strong>${transaction.amount.toFixed(2)}</strong>: {transaction.description} on {new Date(transaction.date).toLocaleString()}
                        {transaction.category ? ` (${transaction.category})` : ''}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SpendingTracker;