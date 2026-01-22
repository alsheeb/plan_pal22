// js/api.js

// تعريف الرابط الأساسي
const BASE_URL = "https://plant-pal-api-qgb0.onrender.com/api";

console.log("🔌 Loading API Module...");

// تعريف الكائن API مباشرة على window
window.API = {
    // 1. فحص الاتصال
    async healthCheck() {
        try {
            const response = await fetch(`${BASE_URL}/health`);
            return await response.json();
        } catch (error) {
            console.error("Health Check Failed:", error);
            // إرجاع كائن وهمي عشان ما يوقف الموقع
            return { status: 'offline', message: error.message };
        }
    },

    // 2. تسجيل جديد
    async register(username, password) {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');
        return data;
    },

    // 3. تسجيل دخول
    async login(username, password) {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        return data;
    },

    // 4. تحليل صورة
    async predict(imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${BASE_URL}/predict`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Prediction failed');
        return data;
    }
};

console.log("✅ API Module Loaded Successfully");
