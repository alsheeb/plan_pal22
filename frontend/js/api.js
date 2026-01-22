// js/api.js

const BASE_URL = "https://plant-pal-api-qgb0.onrender.com/api";

console.log("🔌 Loading API Module...");

window.API = {
    // ---------------------------------------------
    // 1. دوال عامة (لحل مشكلة API.post is not a function)
    // ---------------------------------------------
    async post(endpoint, data) {
        // التأكد من أن الرابط صحيح
        const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
        
        console.log(`POST request to: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || 'Request failed');
        }
        return responseData;
    },

    async get(endpoint) {
        const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
        const response = await fetch(url);
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || 'Request failed');
        }
        return responseData;
    },

    // ---------------------------------------------
    // 2. دوال محددة (Specific Methods)
    // ---------------------------------------------
    async healthCheck() {
        try {
            const response = await fetch(`${BASE_URL}/health`);
            return await response.json();
        } catch (error) {
            console.warn("Health check failed, using offline mode.");
            return { status: 'offline' };
        }
    },

    // هذه الدوال تعتمد الآن على دالة post اللي عرفناها فوق
    // لضمان التوافق سواء استخدمت API.login أو API.post في ملفاتك الأخرى
    async register(username, password) {
        // لاحظ المسار: نرسل فقط /auth/register لأن BASE_URL مدمج في دالة post
        return this.post('/auth/register', { username, password });
    },

    async login(username, password) {
        return this.post('/auth/login', { username, password });
    },

    // ---------------------------------------------
    // 3. دالة التحليل (مختلفة لأنها ترسل ملف وليس JSON)
    // ---------------------------------------------
    async predict(imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${BASE_URL}/predict`, {
            method: 'POST',
            body: formData
            // لا نضع Content-Type هنا، المتصفح يضعه تلقائياً
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Prediction failed');
        return data;
    }
};

console.log("✅ API Module Loaded (with .post helper)");
