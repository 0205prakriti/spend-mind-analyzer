import React, { useState } from 'react';
import './App.css';

const App = () => {
    const [mood, setMood] = useState('');
    const [spending, setSpending] = useState('');

    const handleMoodChange = (event) => {
        setMood(event.target.value);
    };

    const handleSpendingChange = (event) => {
        setSpending(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Handle submission logic here
        console.log(`Mood: ${mood}, Spending: ${spending}`);
    };

    return (
        <div className="dashboard">
            <h1>Spend Mind Analyzer</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Mood:
                        <input type="text" value={mood} onChange={handleMoodChange} />
                    </label>
                </div>
                <div>
                    <label>
                        Spending:
                        <input type="number" value={spending} onChange={handleSpendingChange} />
                    </label>
                </div>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default App;
