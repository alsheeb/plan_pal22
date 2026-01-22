/**
 * Main Application Module
 * Initializes all components and handles global functionality
 */

// Toast Notification System
const Toast = {
    container: null,

    init() {
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    },

    show(message, type = 'info', duration = 4000) {
        if (!this.container) this.init();

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        `;

        this.container.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.remove(toast);
        });

        setTimeout(() => {
            this.remove(toast);
        }, duration);
    },

    remove(toast) {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// Make Toast globally available
window.Toast = Toast;

// Mobile Menu Handler
const MobileMenu = {
    init() {
        const menuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.querySelector('.nav-links');

        if (!menuBtn || !navLinks) return;

        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });

        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuBtn.classList.remove('active');
            });
        });
    }
};

// Smooth Scroll for Anchor Links
const SmoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌿 PlantCare AI Initializing...');

    // Initialize UI Components
    Toast.init();
    MobileMenu.init();
    SmoothScroll.init();

    const path = window.location.pathname.toLowerCase();
    const hasAuth = typeof Auth !== 'undefined';

    // 1. Auth Redirection Logic
    if (hasAuth) {
        Auth.updateNav();

        if (!Auth.isLoggedIn()) {
            // Protected routes: Redirect to login if not authenticated
            if (path.endsWith('index.html') || path === '/' || path.endsWith('history.html') || path.endsWith('community.html')) {
                // Check if already on login page to avoid loop
                if (!path.endsWith('login.html') && !path.endsWith('register.html')) {
                    window.location.href = 'login.html';
                    return;
                }
            }
        } else {
            // If logged in, redirect away from auth pages
            if (path.endsWith('login.html') || path.endsWith('register.html')) {
                window.location.href = 'index.html';
                return;
            }
        }
    }

    // 2. Upload Module Initialization
    if (typeof Upload !== 'undefined') {
        Upload.init();
    }

    // 3. New Analysis Button Logic
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    if (newAnalysisBtn && typeof Upload !== 'undefined') {
        newAnalysisBtn.addEventListener('click', () => {
            Upload.reset();
            const uploadSection = document.getElementById('upload');
            if(uploadSection) {
                uploadSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 4. Safe API Health Check
    // ننتظر قليلاً للتأكد من تحميل api.js
    setTimeout(() => {
        if (typeof API !== 'undefined' && typeof API.healthCheck === 'function') {
            API.healthCheck()
                .then(response => {
                    if (response.status === 'healthy') {
                        console.log('✅ API Connected Successfully');
                    } else {
                        console.warn('⚠️ API Connected but status is:', response.status);
                    }
                })
                .catch(err => console.warn('⚠️ API Connection Warning:', err));
        } else {
            console.error('❌ API module not loaded correctly. Check script order in HTML.');
        }
    }, 100);

    console.log('✅ PlantCare AI Ready!');
});
