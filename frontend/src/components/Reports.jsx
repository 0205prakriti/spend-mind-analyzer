import React, { useEffect, useMemo, useState } from 'react';
import { get } from '../utils/api';

const formatDateInput = (date) => date.toISOString().slice(0, 10);

const Reports = ({ refreshKey }) => {
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

    const filteredTransactions = useMemo(
        () =>
            transactions.filter((item) => {
                const itemDate = new Date(item.date);
                if (Number.isNaN(itemDate.getTime())) return false;

                if (startDate) {
                    const fromDate = new Date(`${startDate}T00:00:00`);
                    if (itemDate < fromDate) return false;
                }

                if (endDate) {
                    const toDate = new Date(`${endDate}T23:59:59.999`);
                    if (itemDate > toDate) return false;
                }

                return true;
            }),
        [transactions, startDate, endDate]
    );

    const totalSpent = useMemo(
        () =>
            filteredTransactions.reduce(
                (sum, item) => sum + (Number(item.amount) || 0),
                0
            ),
        [filteredTransactions]
    );

    const hasActiveFilter = useMemo(
        () => Boolean(startDate || endDate),
        [startDate, endDate]
    );

    const categoryBreakdown = useMemo(() => {
        const categoryTotals = filteredTransactions.reduce((acc, item) => {
            const key = item.category?.trim() || 'Uncategorized';
            const amount = Number(item.amount) || 0;
            acc[key] = (acc[key] || 0) + amount;
            return acc;
        }, {});

        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions]);

    const topCategory = useMemo(
        () => (categoryBreakdown.length ? categoryBreakdown[0] : null),
        [categoryBreakdown]
    );

    const setQuickRange = (days) => {
        const now = new Date();
        const end = formatDateInput(now);
        const startDateValue = new Date(now);
        startDateValue.setDate(startDateValue.getDate() - (days - 1));
        const start = formatDateInput(startDateValue);
        setStartDate(start);
        setEndDate(end);
    };

    const setThisMonth = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setStartDate(formatDateInput(start));
        setEndDate(formatDateInput(now));
    };

    const handleExport = () => {
        if (!filteredTransactions.length) return;

        const header = ['date', 'description', 'category', 'amount'];
        const rows = filteredTransactions.map((item) => [
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
        const startLabel = startDate || 'start';
        const endLabel = endDate || 'end';
        const fileName = hasActiveFilter
            ? `spend-mind-report-${startLabel}_to_${endLabel}.csv`
            : 'spend-mind-report-all-time.csv';
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
    };

    return (
        <div>
            <h1>Data Export and Reporting</h1>
            <div>
                <label htmlFor="report-start-date">From: </label>
                <input
                    id="report-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <label htmlFor="report-end-date" style={{ marginLeft: '8px' }}>
                    To:{' '}
                </label>
                <input
                    id="report-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <button
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilter}
                    style={{ marginLeft: '8px' }}
                >
                    Clear Dates
                </button>
            </div>
            <div style={{ marginTop: '8px' }}>
                <button onClick={setThisMonth}>This Month</button>
                <button onClick={() => setQuickRange(30)} style={{ marginLeft: '8px' }}>
                    Last 30 Days
                </button>
                <button onClick={() => setQuickRange(90)} style={{ marginLeft: '8px' }}>
                    Last 90 Days
                </button>
            </div>
            <p>Total Transactions: {filteredTransactions.length}</p>
            <p>Total Spent: ${totalSpent.toFixed(2)}</p>
            <p>
                Top Category:{' '}
                {topCategory
                    ? `${topCategory.category} ($${topCategory.amount.toFixed(2)})`
                    : 'N/A'}
            </p>
            <button onClick={handleExport} disabled={!filteredTransactions.length}>
                Export Data
            </button>
            {!filteredTransactions.length && (
                <p style={{ color: '#555', marginTop: '8px' }}>
                    No transactions match this date range. Try a quick range or clear dates.
                </p>
            )}
            <h2>Category Breakdown</h2>
            {!categoryBreakdown.length ? (
                <p>
                    {hasActiveFilter
                        ? 'No category data for this filtered period.'
                        : 'No category data available yet. Add some transactions to get insights.'}
                </p>
            ) : (
                <ul>
                    {categoryBreakdown.map(({ category, amount }) => (
                        <li key={category}>
                            {category}: ${amount.toFixed(2)} (
                            {totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : '0.0'}
                            %)
                        </li>
                    ))}
                </ul>
            )}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </div>
    );
};

export default Reports;