import React, { useState } from 'react';

const SpendingTracker = () => {
    const [transactions, setTransactions] = useState([]);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const handleAddTransaction = () => {
        if (amount && description) {
            const newTransaction = {
                id: Date.now(),
                amount: parseFloat(amount),
                description,
                date: new Date().toISOString(),
            };
            setTransactions([...transactions, newTransaction]);
            setAmount('');
            setDescription('');
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
                <button onClick={handleAddTransaction}>Add Transaction</button>
            </div>
            <h3>Transaction History</h3>
            <ul>
                {transactions.map((transaction) => (
                    <li key={transaction.id}>
                        <strong>${transaction.amount.toFixed(2)}</strong>: {transaction.description} on {new Date(transaction.date).toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SpendingTracker;