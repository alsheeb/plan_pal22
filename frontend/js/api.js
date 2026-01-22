// تأكد من مسح أي تعريف قديم لـ API أو API_URL في هذا الملف
const API_BASE_URL = "https://plant-pal-api-qgb0.onrender.com/api";

const API = {
    // 1. فحص الاتصال
    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (!response.ok) throw new Error('Health check failed');
            return await response.json();
        } catch (error) {
            console.error("Health Check Error:", error);
            throw error;
        }
    },

    // 2. تسجيل مستخدم جديد
    async register(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');
            return data;
        } catch (error) {
            console.error("Register Error:", error);
            throw error;
        }
    },

    // 3. تسجيل الدخول
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');
            return data;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    },

    // 4. تحليل صورة النبات
    async predict(imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                body: formData
                // لا تضع Content-Type هنا، المتصفح سيضعه تلقائياً مع الـ Boundary
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Prediction failed');
            return data;
        } catch (error) {
            console.error("Prediction Error:", error);
            throw error;
        }
    }
};

// تصدير الكائن للاستخدام في الملفات الأخرى
window.API = API; 
