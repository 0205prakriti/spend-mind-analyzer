import React, { useEffect, useMemo, useState } from 'react';
import { get } from '../utils/api';

const Reports = ({ refreshKey }) => {
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');

    const loadTransactions = async () => {
        try {
            setError('');
            const response = await get('/transactions/');
            setTransactions(response.transactions || []);
        } catch (err) {
            setError(err.message || 'Failed to load report data');
        }
    };

    useEffect(() => {
        loadTransactions();
    }, [refreshKey]);

    const totalSpent = useMemo(
        () => transactions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        [transactions]
    );

    const handleExport = () => {
        if (!transactions.length) return;

        const header = ['date', 'description', 'category', 'amount'];
        const rows = transactions.map((item) => [
            new Date(item.date).toISOString(),
            item.description || '',
            item.category || '',
            Number(item.amount || 0).toFixed(2),
        ]);

        const csv = [header, ...rows]
            .map((row) =>
                row
                    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                    .join(',')
            )
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'spend-mind-report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h1>Data Export and Reporting</h1>
            <p>Total Transactions: {transactions.length}</p>
            <p>Total Spent: ${totalSpent.toFixed(2)}</p>
            <button onClick={handleExport} disabled={!transactions.length}>
                Export Data
            </button>
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </div>
    );
};

export default Reports;