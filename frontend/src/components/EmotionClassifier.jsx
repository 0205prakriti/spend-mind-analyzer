import React, { useState } from 'react';
import { post } from '../utils/api';

const formatEmotionLabel = (raw) => {
    if (!raw || typeof raw !== 'string') return raw;
    const lower = raw.replace(/_/g, ' ').toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const EmotionClassifier = () => {
    const [text, setText] = useState('');
    const [classification, setClassification] = useState(null);
    const [lastSubmittedText, setLastSubmittedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setLastSubmittedText(text.trim());
        try {
            const result = await post('/classify-emotion/', { text });
            setClassification(result);
        } catch (err) {
            setError(err.message || 'Failed to classify emotion');
        } finally {
            setLoading(false);
        }
    };

    const modelOk = classification && classification.model_available !== false;
    const confidencePct =
        modelOk && typeof classification.score === 'number'
            ? Math.min(100, Math.max(0, classification.score * 100))
            : null;

    return (
        <div>
            <h2>Emotion Classifier</h2>
            <p style={{ color: '#444', fontSize: '0.95rem', maxWidth: '36rem' }}>
                After you click <strong>Classify</strong>, you should see a result box below with your text, a
                detected mood (e.g. <em>Sadness</em> for &quot;sad&quot;), and a confidence percentage. That comes
                from a small on-device model (7 emotions: joy, sadness, anger, fear, surprise, disgust, neutral).
            </p>
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
                <div
                    style={{
                        marginTop: '16px',
                        padding: '14px 16px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        backgroundColor: '#fafafa',
                        maxWidth: '32rem',
                    }}
                >
                    <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#555' }}>
                        <strong>Analyzed:</strong> &quot;{lastSubmittedText}&quot;
                    </p>
                    {modelOk ? (
                        <>
                            <p style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>
                                Detected:{' '}
                                <strong style={{ color: '#1e1b4b' }}>
                                    {formatEmotionLabel(classification.emotion)}
                                </strong>
                            </p>
                            {confidencePct !== null && (
                                <p style={{ margin: 0, color: '#444' }}>
                                    Confidence: <strong>{confidencePct.toFixed(1)}%</strong>
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <p style={{ margin: '0 0 8px', color: '#b45309', fontWeight: 600 }}>
                                The AI model did not run — no real classification for your text.
                            </p>
                            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#444' }}>
                                The API needs <strong>PyTorch</strong> installed in the same Python environment as
                                FastAPI. Until then, the server returns a placeholder only.
                            </p>
                            <pre
                                style={{
                                    margin: 0,
                                    padding: '10px',
                                    background: '#fff',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    overflow: 'auto',
                                }}
                            >
                                {`.venv/bin/pip install torch   # or: pip install torch\n`}
                                {`.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000`}
                            </pre>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmotionClassifier;