import React from 'react';
import { Line } from 'react-chartjs-2';

const CorrelationAnalyzer = ({ moodData, spendingData }) => {
    const data = {
        labels: moodData.map(item => item.date),
        datasets: [
            {
                label: 'Mood',
                data: moodData.map(item => item.value),
                borderColor: 'rgba(75,192,192,1)',
                borderWidth: 2,
                fill: false,
            },
            {
                label: 'Spending',
                data: spendingData.map(item => item.value),
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 2,
                fill: false,
            },
        ],
    };

    return (
        <div>
            <h2>Mood vs Spending Correlation</h2>
            <Line data={data} />
        </div>
    );
};

export default CorrelationAnalyzer;
