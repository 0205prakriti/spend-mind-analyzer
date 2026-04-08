import React, { useState } from 'react';

const JournalEntry = () => {
    const [entry, setEntry] = useState('');

    const handleChange = (e) => {
        setEntry(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Journal Entry:', entry);
        setEntry('');
    };

    return (
        <div>
            <h2>Journal Entry</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={entry}
                    onChange={handleChange}
                    placeholder="Write your journal entry here..."
                    rows="10"
                    cols="50"
                />
                <br />
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default JournalEntry;