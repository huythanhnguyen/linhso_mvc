/**
 * LoginView
 * Quản lý hiển thị và tương tác trên trang đăng nhập
 */

import EventBus from '../../core/EventBus.js';

const LoginView = (function() {
    // Cache DOM elements
    let elements = {};
    
    /**
     * Khởi tạo view
     */
    function init() {
        console.log('LoginView initializing...');
        
        // Cache DOM elements
        elements = {
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            login: {
                form: document.getElementById('login-form'),
                email: document.getElementById('login-email'),
                password: document.getElementById('login-password'),
                submitBtn: document.getElementById('login-btn'),
                message: document.getElementById('login-message')
            },
            register: {
                form: document.getElementById('register-form'),
                name: document.getElementById('register-name'),
                email: document.getElementById('register-email'),
                password: document.getElementById('register-password'),
                submitBtn: document.getElementById('register-btn'),
                message: document.getElementById('register-message')
            },
            authTabs: document.querySelectorAll('.auth-tab'),
            backToHomeLink: document.querySelector('.back-to-home'),
            loadingContainer: document.getElementById('loading-container')
        };
        
        console.log('DOM elements:', elements);
        
        // Hide loading screen
        if (elements.loadingContainer) {
            elements.loadingContainer.style.display = 'none';
        }
        
        // Set up event listeners for login form
        if (elements.login.submitBtn) {
            console.log('Setting up login button listener');
            elements.login.submitBtn.addEventListener('click', handleLogin);
        }
        
        if (elements.login.password) {
            elements.login.password.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
        
        // Set up event listeners for register form
        if (elements.register.submitBtn) {
            console.log('Setting up register button listener');
            elements.register.submitBtn.addEventListener('click', handleRegister);
        }
        
        if (elements.register.password) {
            elements.register.password.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    handleRegister();
                }
            });
        }
        
        // Set up event listeners for auth tabs
        elements.authTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                switchAuthTab(tabName);
            });
        });
        
        // Check URL parameters for initial tab
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab === 'register') {
            switchAuthTab('register');
        }
        
        // Subscribe to events
        EventBus.subscribe('auth:loginResult', handleLoginResult);
        EventBus.subscribe('auth:registerResult', handleRegisterResult);
        
        // Check auth status
        checkAuthStatus();
        
        console.log('LoginView initialized successfully');
    }
    
    /**
     * Kiểm tra trạng thái xác thực và chuyển hướng nếu cần
     */
    function checkAuthStatus() {
        // Check if token exists in localStorage
        const token = localStorage.getItem('phone_analysis_token');
        const user = localStorage.getItem('phone_analysis_user');
        
        if (token && user) {
            console.log('User already logged in, redirecting to app');
            // Redirect to app page
            window.location.href = 'app.html';
        }
    }
    
    /**
     * Xử lý đăng nhập
     */
    function handleLogin() {
        console.log('Handle login triggered');
        
        const login = elements.login;
        if (!login.email || !login.password || !login.message) {
            console.error('Login elements not found', login);
            return;
        }
        
        const email = login.email.value.trim();
        const password = login.password.value;
        
        console.log('Login attempt with email:', email);
        
        // Validate inputs
        if (!email) {
            login.message.textContent = 'Vui lòng nhập email';
            login.email.focus();
            return;
        }
        
        if (!password) {
            login.message.textContent = 'Vui lòng nhập mật khẩu';
            login.password.focus();
            return;
        }
        
        // Display processing message
        login.message.textContent = 'Đang đăng nhập...';
        login.message.style.color = 'var(--text-secondary)';
        
        // Disable submit button
        if (login.submitBtn) {
            login.submitBtn.disabled = true;
        }
        
        // Emit login event
        console.log('Publishing auth:login event');
        EventBus.publish('auth:login', { email, password });
    }
    
    /**
     * Xử lý kết quả đăng nhập
     * @param {Object} result - Kết quả đăng nhập
     */
    function handleLoginResult(result) {
        console.log('Login result received:', result);
        
        const login = elements.login;
        if (!login.message || !login.submitBtn) {
            console.error('Login result elements not found');
            return;
        }
        
        // Re-enable submit button
        login.submitBtn.disabled = false;
        
        if (result.success) {
            login.message.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
            login.message.style.color = 'var(--success-color)';
            
            // Redirect to app page
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 1000);
        } else {
            login.message.textContent = result.error || 'Đăng nhập thất bại';
            login.message.style.color = 'var(--danger-color)';
            
            // Clear password field
            if (login.password) {
                login.password.value = '';
                login.password.focus();
            }
        }
    }
    
    /**
     * Xử lý đăng ký
     */
    function handleRegister() {
        console.log('Handle register triggered');
        
        const register = elements.register;
        if (!register.name || !register.email || !register.password || !register.message) {
            console.error('Register elements not found', register);
            return;
        }
        
        const name = register.name.value.trim();
        const email = register.email.value.trim();
        const password = register.password.value;
        
        console.log('Register attempt with email:', email);
        
        // Validate inputs
        if (!name) {
            register.message.textContent = 'Vui lòng nhập tên';
            register.name.focus();
            return;
        }
        
        if (!email) {
            register.message.textContent = 'Vui lòng nhập email';
            register.email.focus();
            return;
        }
        
        if (!password) {
            register.message.textContent = 'Vui lòng nhập mật khẩu';
            register.password.focus();
            return;
        }
        
        if (password.length < 6) {
            register.message.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            register.password.focus();
            return;
        }
        
        // Display processing message
        register.message.textContent = 'Đang đăng ký...';
        register.message.style.color = 'var(--text-secondary)';
        
        // Disable submit button
        if (register.submitBtn) {
            register.submitBtn.disabled = true;
        }
        
        // Emit register event
        console.log('Publishing auth:register event');
        EventBus.publish('auth:register', { name, email, password });
    }
    
    /**
     * Xử lý kết quả đăng ký
     * @param {Object} result - Kết quả đăng ký
     */
    function handleRegisterResult(result) {
        console.log('Register result received:', result);
        
        const register = elements.register;
        if (!register.message || !register.submitBtn) {
            console.error('Register result elements not found');
            return;
        }
        
        // Re-enable submit button
        register.submitBtn.disabled = false;
        
        if (result.success) {
            register.message.textContent = 'Đăng ký thành công! Đang chuyển hướng...';
            register.message.style.color = 'var(--success-color)';
            
            // Redirect to app page
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 1000);
        } else {
            register.message.textContent = result.error || 'Đăng ký thất bại';
            register.message.style.color = 'var(--danger-color)';
        }
    }
    
    /**
     * Chuyển đổi giữa các tab đăng nhập/đăng ký
     * @param {string} tabName - Tên tab ('login' hoặc 'register')
     */
    function switchAuthTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update tab buttons
        elements.authTabs.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetButton = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // Update forms
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) loginForm.classList.remove('active');
        if (registerForm) registerForm.classList.remove('active');
        
        if (tabName === 'login' && loginForm) {
            loginForm.classList.add('active');
        } else if (tabName === 'register' && registerForm) {
            registerForm.classList.add('active');
        }
        
        // Update title
        const authHeader = document.querySelector('.auth-header h3');
        if (authHeader) {
            authHeader.textContent = tabName === 'login' ? 'Đăng Nhập' : 'Đăng Ký';
        }
    }
    
    /**
     * Hiển thị thông báo lỗi bên ngoài form
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo ('error', 'success', 'info')
     */
    function showNotification(message, type = 'error') {
        // Check if notification exists
        let notification = document.querySelector('.login-notification');
        
        if (!notification) {
            // Create notification element
            notification = document.createElement('div');
            notification.className = 'login-notification';
            
            // Add to DOM
            const container = document.querySelector('.login-container');
            if (container) {
                container.insertBefore(notification, container.firstChild);
            } else {
                document.body.appendChild(notification);
            }
        }
        
        // Set class based on type
        notification.className = `login-notification ${type}`;
        notification.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }
    
    /**
     * Đặt trạng thái loading
     * @param {boolean} isLoading - Trạng thái loading
     */
    function setLoading(isLoading) {
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        
        // Disable/enable buttons and inputs
        buttons.forEach(button => {
            button.disabled = isLoading;
        });
        
        inputs.forEach(input => {
            input.disabled = isLoading;
        });
        
        // Show/hide loading container
        if (elements.loadingContainer) {
            elements.loadingContainer.style.display = isLoading ? 'flex' : 'none';
        }
    }
    
    return {
        init,
        showNotification,
        setLoading,
        switchAuthTab,
        handleLoginResult,
        handleRegisterResult
    };
})();

export default LoginView;

// Tự động khởi tạo khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing LoginView');
    LoginView.init();
});

// Debug EventBus
console.log('EventBus in LoginView:', EventBus);