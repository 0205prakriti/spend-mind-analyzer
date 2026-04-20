import React, { useState } from 'react';
import './App.css';
import EmotionClassifier from './components/EmotionClassifier';
import SpendingTracker from './components/SpendingTracker';
import CorrelationAnalyzer from './components/CorrelationAnalyzer';

const App = () => {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleTransactionAdded = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="dashboard">
            <h1>Spend Mind Analyzer</h1>
            <EmotionClassifier />
            <SpendingTracker onTransactionAdded={handleTransactionAdded} />
            <CorrelationAnalyzer refreshKey={refreshKey} />
        </div>
    );
};

export default App;
