import React from 'react';
import { Line } from 'react-chartjs-2';

const Dashboard = () => {
    // Sample data for mood and spending visualization
    const data = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
            {
                label: 'Mood (scale 1-10)',
                data: [5, 6, 7, 8, 6, 5, 7],
                borderColor: 'rgba(75,192,192,1)',
                backgroundColor: 'rgba(75,192,192,0.2)',
                fill: true,
            },
            {
                label: 'Spending ($)',
                data: [200, 300, 250, 400, 150, 500, 600],
                borderColor: 'rgba(255,99,132,1)',
                backgroundColor: 'rgba(255,99,132,0.2)',
                fill: true,
            },
        ],
    }

    const options = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <div>
            <h2>Mood and Spending Visualization Dashboard</h2>
            <Line data={data} options={options} />
        </div>
    );
};

export default Dashboard;
