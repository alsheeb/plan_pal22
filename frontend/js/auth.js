const Auth = {
    /* Register a new user */
    async register(fullName, email, password) {
        try {
            const response = await API.post('/auth/register', {
                full_name: fullName,
                email: email,
                password: password
            }, false);

            if (response.success) {
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));

                this.updateNav();
                Toast.success('Account created successfully!');

                // بعد التسجيل، نرسل المستخدم لصفحة تسجيل الدخول
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 800);
            }

            return response;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Registration failed'
            };
        }
    },

    /**
     * Login user + redirect to OTP page
     */
    async login(email, password) {
        try {
            const response = await API.post('/auth/login', {
                email: email,
                password: password
            }, false);

            if (response.success) {
                // Store token and user info
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));

                // IMPORTANT: save email for OTP page
                localStorage.setItem('pending_email', email);

                // Update navigation
                this.updateNav();

                // Show success toast
                Toast.success('Welcome back!');

                // Instead of going to index.html, go to OTP page
                setTimeout(() => {
                    window.location.href = 'otp.html';
                }, 800);
            }

            return response;
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
        localStorage.removeItem('pending_email');

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

    getToken() {
        return localStorage.getItem('access_token');
    },

    updateNav() {
        const authNav = document.getElementById('auth-nav');
        if (!authNav) return;

        if (this.isLoggedIn()) {
            const user = this.getUser();
            const initials = user.full_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

            authNav.innerHTML = `
                <div class="user-menu" id="userMenu">
                    <button class="user-menu-btn" id="userMenuBtn">
                        <div class="user-avatar">${initials}</div>
                        <span>${user.full_name.split(' ')[0]}</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                        </svg>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-item" style="pointer-events: none; opacity: 0.7;">
                            <span>👤</span>
                            <span>${user.email}</span>
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

            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('active');
            });

            logoutBtn.addEventListener('click', () => {
                this.logout();
            });

            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
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
    },

    async verifyToken() {
        if (!this.isLoggedIn()) return false;

        try {
            const response = await API.get('/auth/me');
            return response.success;
        } catch (error) {
            this.logout();
            return false;
        }
    }
};