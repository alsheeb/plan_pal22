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

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};

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

    const path = window.location.pathname.toLowerCase();

    // Helper: on this page and Auth object موجود
    const hasAuth = typeof Auth !== 'undefined';

    if (hasAuth && !Auth.isLoggedIn()) {
        if (path.endsWith('index.html') || path === '/' || path === '/index') {
            window.location.href = 'login.html';
            return;
        }
        if (path.endsWith('history.html')) {
            window.location.href = 'login.html';
            return;
        }
    }

    // 2) لو المستخدم مسجّل الدخول:
    //    - لا داعي لبقائه في login/register → حوّله إلى index.html
    if (hasAuth && Auth.isLoggedIn()) {
        if (path.endsWith('login.html') || path.endsWith('register.html')) {
            window.location.href = 'index.html';
            return;
        }
    }

    // Initialize Toast system
    Toast.init();

    // Initialize Mobile Menu
    MobileMenu.init();

    // Initialize Smooth Scroll
    SmoothScroll.init();

    if (hasAuth) {
        Auth.updateNav();
    }

    if (typeof Upload !== 'undefined') {
        Upload.init();
    }

    // New Analysis button
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    if (newAnalysisBtn && typeof Upload !== 'undefined') {
        newAnalysisBtn.addEventListener('click', () => {
            Upload.reset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // API health check
    if (typeof API !== 'undefined') {
        API.healthCheck().then(response => {
            if (response.status === 'healthy') {
                console.log('✅ API Connected');
            } else {
                console.warn('⚠️ API Connection Issue:', response.message);
            }
        });
    }

    console.log('✅ PlantCare AI Ready!');
    
});


window.Toast = Toast;