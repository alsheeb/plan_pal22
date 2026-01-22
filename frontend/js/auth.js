const Auth = {
    /* Register a new user */
    async register(fullName, email, password) {
        try {
            console.log("🚀 Registering user:", email);

            // التعديل هنا: السيرفر ينتظر username، لذا نرسل الإيميل كـ username
            const response = await API.post('/auth/register', {
                username: email,  // <-- تغيير المفتاح إلى username
                password: password
            });

            // نفترض أن الرد يأتي بـ message عند النجاح (حسب برمجة الباك إند)
            if (response.message || response.token) {
                // حفظ البيانات وهمياً لأن الباك إند لم يرجع توكن عند التسجيل (حسب الكود السابق)
                // لكن لتجنب الخطأ سنقوم بتسجيل الدخول مباشرة أو التوجيه
                
                Toast.success('Account created successfully!');

                // التوجيه لصفحة الدخول
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 800);
                
                return { success: true };
            }

            return { success: false, message: 'Unknown error' };

        } catch (error) {
            console.error("Register Error:", error);
            return {
                success: false,
                message: error.message || 'Registration failed'
            };
        }
    },

    /**
     * Login user
     */
    async login(email, password) {
        try {
            // التعديل هنا أيضاً: إرسال username بدلاً من email
            const response = await API.post('/auth/login', {
                username: email, 
                password: password
            });

            if (response.token) {
                // Store token and user info
                localStorage.setItem('access_token', response.token);
                // السيرفر يرجع username، سنخزنه
                localStorage.setItem('user', JSON.stringify({ 
                    full_name: response.username, 
                    email: email 
                }));

                this.updateNav();
                Toast.success('Welcome back!');

                setTimeout(() => {
                    window.location.href = 'index.html'; // توجيه للرئيسية مباشرة
                }, 800);

                return { success: true };
            }

            return { success: false, message: 'Invalid credentials' };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        
        this.updateNav();
        Toast.info('You have been logged out');
        window.location.href = 'index.html';
    },

    isLoggedIn() {
        return !!localStorage.getItem('access_token');
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    updateNav() {
        const authNav = document.getElementById('auth-nav');
        if (!authNav) return;

        if (this.isLoggedIn()) {
            const user = this.getUser();
            // التعامل مع الاسم في حال لم يكن موجوداً
            const displayName = user.full_name || user.username || "User";
            const initials = displayName.charAt(0).toUpperCase();

            authNav.innerHTML = `
                <div class="user-menu" id="userMenu">
                    <button class="user-menu-btn" id="userMenuBtn">
                        <div class="user-avatar">${initials}</div>
                        <span>${displayName}</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                        </svg>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-item" style="pointer-events: none; opacity: 0.7;">
                            <span>👤</span>
                            <span>${user.email || displayName}</span>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="history.html" class="dropdown-item">
                            <span>📋</span>
                            <span>My History</span>
                        </a>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item logout" id="logoutBtn">
                            <span>🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            `;

            const userMenu = document.getElementById('userMenu');
            const userMenuBtn = document.getElementById('userMenuBtn');
            const logoutBtn = document.getElementById('logoutBtn');

            if(userMenuBtn) {
                userMenuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userMenu.classList.toggle('active');
                });
            }

            if(logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.logout();
                });
            }

            document.addEventListener('click', (e) => {
                if (userMenu && !userMenu.contains(e.target)) {
                    userMenu.classList.remove('active');
                }
            });
        } else {
            authNav.innerHTML = `
                <div class="auth-buttons">
                    <a href="login.html" class="btn btn-outline">Login</a>
                    <a href="register.html" class="btn btn-primary">Sign Up</a>
                </div>
            `;
        }
    }
};

// Initialize nav on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNav();
});
