/**
 * LoginView
 * Quản lý hiển thị và tương tác trên trang đăng nhập
 */

import EventBus from '../../core/EventBus.js';

const LoginView = (function() {
    // Cache DOM elements
    let elements = {};
    
    /**
     * Xử lý kết quả đăng nhập
     * @param {Object} result - Kết quả đăng nhập
     */
    function handleLoginResult(result) {
        console.log('Handling login result:', result);
        
        const login = elements.login;
        if (!login.message || !login.submitBtn) return;
        
        // Re-enable submit button
        login.submitBtn.disabled = false;
        
        if (result.success) {
            login.message.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
            login.message.style.color = 'var(--success-color)';
            
            // Lưu token trực tiếp tại đây để đảm bảo
            if (result.token) {
                console.log('Saving token directly from result:', result.token);
                localStorage.setItem('phone_analysis_token', result.token);
            }
            
            // Kiểm tra lại xem token đã được lưu chưa
            console.log('Token in localStorage:', localStorage.getItem('phone_analysis_token'));
            
            // Redirect to app page
            console.log('Redirecting to app.html after 1 second...');
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
     * Xử lý đăng nhập
     * @private
     */
    function handleLogin() {
        console.log('Processing login request');
        const login = elements.login;
        
        // Check if login elements exist
        if (!login.email || !login.password || !login.message) {
            console.error('Login form elements not found');
            return;
        }
        
        const email = login.email.value.trim();
        const password = login.password.value;
        
        console.log('Login credentials (email):', email);
        
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
        
        console.log('Emitting auth:login event');
        
        // Emit login event
        EventBus.publish('auth:login', { email, password });
        
        // Gọi trực tiếp AuthController nếu event không hoạt động
        if (typeof AuthController !== 'undefined' && typeof AuthController.login === 'function') {
            console.log('Calling AuthController.login directly');
            AuthController.login(email, password)
                .then(result => {
                    handleLoginResult(result);
                })
                .catch(error => {
                    console.error('Login failed:', error);
                    handleLoginResult({ 
                        success: false, 
                        error: error.message || 'Đăng nhập thất bại' 
                    });
                });
        }
    }
    
    /**
     * Xử lý đăng ký
     * @private
     */
    function handleRegister() {
        console.log('Processing register request');
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
     * Khởi tạo view
     */
    function init() {
        console.log('LoginView initializing...');
        
        // Kiểm tra nếu đang ở trang login
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.endsWith('/login')) {
            console.log('Not on login page, skipping LoginView initialization');
            return;
        }
        
        console.log('Initializing LoginView for login page');
        
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
        
        console.log('Login form elements:', elements.login);
        console.log('Register form elements:', elements.register);
        
        // Set up event listeners for login form
        if (elements.login.submitBtn) {
            elements.login.submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Login button clicked');
                handleLogin();
            });
        } else {
            console.warn('Login submit button not found');
        }
        
        if (elements.login.password) {
            elements.login.password.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('Enter key pressed in password field');
                    handleLogin();
                }
            });
        }
        
        // Set up event listeners for register form
        if (elements.register.submitBtn) {
            elements.register.submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Register button clicked');
                handleRegister();
            });
        } else {
            console.warn('Register submit button not found');
        }
        
        if (elements.register.password) {
            elements.register.password.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('Enter key pressed in register password field');
                    handleRegister();
                }
            });
        }
        
        // Đăng ký trực tiếp với các form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Login form submitted');
                handleLogin();
            });
        }
        
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Register form submitted');
                handleRegister();
            });
        }
        
        // Subscribe to events
        EventBus.subscribe('auth:loginResult', handleLoginResult);
        EventBus.subscribe('auth:registerResult', handleRegisterResult);
        
        console.log('LoginView initialized successfully');
    }
    
    /**
     * Chuyển đổi giữa các tab đăng nhập/đăng ký
     * @param {string} tabName - Tên tab ('login' hoặc 'register')
     */
    function switchAuthTab(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.auth-tab');
        tabButtons.forEach(btn => {
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
    
    // Khởi tạo khi DOM đã tải xong
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM content loaded, initializing LoginView');
        init();
    });
    
    return {
        init,
        switchAuthTab
    };
})();

export default LoginView;