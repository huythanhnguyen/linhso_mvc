/**
 * FormsView Component
 * Quản lý hiển thị và tương tác với các form
 */

import EventBus from '../../core/EventBus.js';

const FormsView = (function() {
    // Cache DOM elements
    let elements = {};
    
    /**
     * Khởi tạo view
     */
    function init() {
        // Cache DOM elements for login form
        elements.login = {
            form: document.getElementById('login-form'),
            email: document.getElementById('login-email'),
            password: document.getElementById('login-password'),
            submitBtn: document.getElementById('login-btn'),
            message: document.getElementById('login-message')
        };
        
        // Cache DOM elements for register form
        elements.register = {
            form: document.getElementById('register-form'),
            name: document.getElementById('register-name'),
            email: document.getElementById('register-email'),
            password: document.getElementById('register-password'),
            submitBtn: document.getElementById('register-btn'),
            message: document.getElementById('register-message')
        };
        
        // Cache DOM elements for auth tabs
        elements.authTabs = document.querySelectorAll('.auth-tab');
        
        // Set up event listeners for login form
        if (elements.login.submitBtn) {
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
    }
    
    /**
     * Xử lý đăng nhập
     * @private
     */
    function handleLogin() {
        const login = elements.login;
        if (!login.email || !login.password || !login.message) return;
        
        const email = login.email.value.trim();
        const password = login.password.value;
        
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
        EventBus.publish('auth:login', { email, password });
    }
    
    /**
     * Xử lý kết quả đăng nhập
     * @param {Object} result - Kết quả đăng nhập
     */
    function handleLoginResult(result) {
        const login = elements.login;
        if (!login.message || !login.submitBtn) return;
        
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
     * @private
     */
    function handleRegister() {
        const register = elements.register;
        if (!register.name || !register.email || !register.password || !register.message) return;
        
        const name = register.name.value.trim();
        const email = register.email.value.trim();
        const password = register.password.value;
        
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
        EventBus.publish('auth:register', { name, email, password });
    }
    
    /**
     * Xử lý kết quả đăng ký
     * @param {Object} result - Kết quả đăng ký
     */
    function handleRegisterResult(result) {
        const register = elements.register;
        if (!register.message || !register.submitBtn) return;
        
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
    
    return {
        init,
        switchAuthTab
    };
})();

export default FormsView;