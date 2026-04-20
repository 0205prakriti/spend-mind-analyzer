import React, { useEffect, useState } from 'react';
import { get } from '../utils/api';

const CorrelationAnalyzer = ({ refreshKey }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await get('/correlation/');
            setAnalytics(data);
        } catch (err) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [refreshKey]);

    const spendByCategory = analytics?.spend_by_category || {};

    return (
        <div>
            <h2>Spending Analytics</h2>
            <button onClick={loadAnalytics} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh Analysis'}
            </button>

            {error && <p style={{ color: 'crimson' }}>{error}</p>}

            {analytics && (
                <div>
                    <p>Total Transactions: {analytics.total_transactions}</p>
                    <p>Total Spend: ${Number(analytics.total_spend || 0).toFixed(2)}</p>

                    <h3>Spend by Category</h3>
                    <ul>
                        {Object.entries(spendByCategory).map(([category, amount]) => (
                            <li key={category}>
                                {category}: ${Number(amount).toFixed(2)}
                            </li>
                        ))}
                    </ul>

                    <h3>Category Clusters</h3>
                    <ul>
                        {(analytics.clusters || []).map((item) => (
                            <li key={`${item.category}-${item.cluster}`}>
                                {item.category}: cluster {item.cluster}, avg ${Number(item.avg_spend).toFixed(2)}
                            </li>
                        ))}
                    </ul>

                    <h3>Anomalies</h3>
                    <ul>
                        {(analytics.anomalies || []).map((item, idx) => (
                            <li key={`${item.date}-${idx}`}>
                                {new Date(item.date).toLocaleDateString()}: ${Number(item.amount).toFixed(2)} ({item.category})
                            </li>
                        ))}
                    </ul>

                    <h3>Recurring Expenses</h3>
                    <ul>
                        {(analytics.recurring_expenses || []).map((item) => (
                            <li key={`${item.merchant_key}-${item.category}`}>
                                {item.merchant_key} ({item.category}) every ~{item.estimated_frequency_days} days, avg ${Number(item.avg_amount).toFixed(2)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CorrelationAnalyzer;
