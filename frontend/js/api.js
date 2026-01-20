/**
 * API Communication Module
 * Handles all HTTP requests to the backend
 */

const API = {
    // Base URL for API endpoints
    baseURL: `${window.location.origin}/api`,

    
    /**
     * Get authorization headers
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth) {
            const token = localStorage.getItem('access_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    },
    
    /**
     * Handle API response
     */
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            // Handle token expiration
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
            }
            throw new Error(data.message || 'An error occurred');
        }
        
        return data;
    },
    
    /**
     * POST request
     */
    async post(endpoint, body, includeAuth = true) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(body)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    
    /**
     * GET request
     */
    async get(endpoint, includeAuth = true) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(includeAuth)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    
    /**
     * Upload image for prediction
     */
    async predict(imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const headers = {};
            const token = localStorage.getItem('access_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${this.baseURL}/predict`, {
                method: 'POST',
                headers: headers,
                body: formData
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Prediction Error:', error);
            throw error;
        }
    },
    
    /**
     * Get user prediction history
     */
    async getHistory(limit = 20) {
        return await this.get(`/history?limit=${limit}`);
    },
    
    /**
     * Get disease info by ID
     */
    async getDiseaseById(id) {
        return await this.get(`/disease/${id}`, false);
    },
    
    /**
     * Get all diseases
     */
    async getAllDiseases() {
        return await this.get('/diseases', false);
    },
    
    /**
     * Search disease by name
     */
    async searchDisease(name) {
        return await this.get(`/disease/search/${encodeURIComponent(name)}`, false);
    },
    
    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return await response.json();
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
    
};
