import React, { useState } from 'react';
import { post } from '../utils/api';

const EmotionClassifier = () => {
    const [text, setText] = useState('');
    const [classification, setClassification] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await post('/classify-emotion/', { text });
            setClassification(result);
        } catch (err) {
            setError(err.message || 'Failed to classify emotion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Emotion Classifier</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="emotion-text">How are you feeling?</label>
                <input
                    type="text"
                    id="emotion-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="I feel calm but a bit tired today"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Classifying...' : 'Classify'}
                </button>
            </form>
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {classification && (
                <>
                    <p>
                        Emotion: <strong>{classification.emotion}</strong>
                        {typeof classification.score === 'number' ? ` (score: ${classification.score})` : ''}
                    </p>
                    {classification.model_available === false && (
                        <p style={{ color: 'darkorange' }}>
                            Emotion model is currently unavailable; showing neutral fallback.
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export default EmotionClassifier;