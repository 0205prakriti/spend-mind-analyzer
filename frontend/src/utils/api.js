const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

/**
 * Function to make GET requests.
 * @param {string} endpoint - The endpoint to hit.
 * @returns {Promise} - Promise representing the response from the API.
 */
async function get(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
        const message = `GET ${endpoint} failed with ${response.status}`;
        throw new Error(message);
    }
    return response.json();
}

/**
 * Function to make POST requests.
 * @param {string} endpoint - The endpoint to hit.
 * @param {object} data - The data to send in the request body.
 * @returns {Promise} - Promise representing the response from the API.
 */
async function post(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const message = `POST ${endpoint} failed with ${response.status}`;
        throw new Error(message);
    }
    return response.json();
}

// Exporting the functions for use in other modules
export { get, post };