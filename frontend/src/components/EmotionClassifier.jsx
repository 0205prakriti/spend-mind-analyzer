import React, { useState } from 'react';

const EmotionClassifier = () => {
    const [emotion, setEmotion] = useState('');
    const [classification, setClassification] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Logic for classifying the emotion would go here
        // For demonstration, let's just set the classification to the input emotion
        setClassification(`You are feeling: ${emotion}`);
    };

    return (
        <div>
            <h2>Emotion Classifier</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="emotion">Enter your emotion:</label>
                <input
                    type="text"
                    id="emotion"
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    required
                />
                <button type="submit">Classify</button>
            </form>
            {classification && <p>{classification}</p>}
        </div>
    );
};

export default EmotionClassifier;