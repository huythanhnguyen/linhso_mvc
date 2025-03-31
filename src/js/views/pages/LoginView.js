/**
 * LoginView
 * Quản lý hiển thị và tương tác trên trang đăng nhập
 */

import EventBus from '../../core/EventBus.js';
import AuthController from '../../controllers/AuthController.js';

const LoginView = (function() {
    // Cache DOM elements
    let elements = {};
    let initialized = false;
    
    /**
     * Kiểm tra xem trang hiện tại có phải là trang login không
     * @returns {boolean} True nếu đang ở trang login
     */
    function isLoginPage() {
        return window.location.pathname.includes('login.html');
    }
    
    /**
     * Khởi tạo view
     */
    function init() {
        console.log('LoginView initializing...');
        
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM content loaded, initializing LoginView');
            
            // Check if already initialized
            if (initialized) {
                console.log('LoginView already initialized, skipping');
                return;
            }
            
            // Check if this is the login page
            if (!isLoginPage()) {
                console.log('Not on login page, skipping LoginView initialization');
                return;
            }
            
            // Cache DOM elements
            elements = {
                loginForm: document.getElementById('login-form'),
                loginEmail: document.getElementById('login-email'),
                loginPassword: document.getElementById('login-password'),
                loginButton: document.getElementById('login-btn'),
                loginMessage: document.getElementById('login-message'),
                
                registerForm: document.getElementById('register-form'),
                registerName: document.getElementById('register-name'),
                registerEmail: document.getElementById('register-email'),
                registerPassword: document.getElementById('register-password'),
                registerButton: document.getElementById('register-btn'),
                registerMessage: document.getElementById('register-message'),
                
                authTabs: document.querySelectorAll('.auth-tab'),
                
                backToHomeLink: document.querySelector('.back-to-home'),
                loadingContainer: document.getElementById('loading-container')
            };
            
            console.log('DOM elements:', elements);
            
            // Verify if elements were found
            if (!elements.loginForm || !elements.registerForm) {
                console.warn('Login forms not found in the DOM. Make sure the IDs match those in the HTML.');
            }
            
            // Hide loading screen
            if (elements.loadingContainer) {
                elements.loadingContainer.style.display = 'none';
            }
            
            // Set up event listeners for login form
            if (elements.loginButton) {
                console.log('Setting up login button listener');
                elements.loginButton.addEventListener('click', handleLogin);
            }
            
            if (elements.loginPassword) {
                console.log('Setting up login password enter key listener');
                elements.loginPassword.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        handleLogin();
                    }
                });
            }
            
            // Set up event listeners for register form
            if (elements.registerButton) {
                console.log('Setting up register button listener');
                elements.registerButton.addEventListener('click', handleRegister);
            }
            
            if (elements.registerPassword) {
                console.log('Setting up register password enter key listener');
                elements.registerPassword.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        handleRegister();
                    }
                });
            }
            
            // Set up auth tabs
            if (elements.authTabs && elements.authTabs.length > 0) {
                elements.authTabs.forEach(tab => {
                    tab.addEventListener('click', function() {
                        const tabName = this.getAttribute('data-tab');
                        console.log('Auth tab clicked:', tabName);
                        switchAuthTab(tabName);
                    });
                });

                // Check URL parameters for initial tab
                const urlParams = new URLSearchParams(window.location.search);
                const tab = urlParams.get('tab');
                if (tab === 'register') {
                    console.log('URL parameter tab=register found, switching to register tab');
                    switchAuthTab('register');
                }
            }
            
            // Subscribe to events
            console.log('Subscribing to auth events');
            EventBus.subscribe('auth:loginSuccess', handleLoginSuccess);
            EventBus.subscribe('auth:loginFailed', handleLoginFailed);
            EventBus.subscribe('auth:registerSuccess', handleRegisterSuccess);
            EventBus.subscribe('auth:registerFailed', handleRegisterFailed);
            
            // Initialize AuthController if needed
            try {
                AuthController.init();
                console.log('AuthController initialized');
            } catch (error) {
                console.error('Error initializing AuthController:', error);
            }
            
            // Check authentication status
            checkAuthStatus();
            
            initialized = true;
            console.log('LoginView initialized successfully');
        });
    }
    
    /**
     * Kiểm tra trạng thái xác thực và chuyển hướng nếu cần
     * @private
     */
    function checkAuthStatus() {
        console.log('Checking auth status...');
        // Check if token exists in localStorage
        const token = localStorage.getItem('phone_analysis_token');
        const user = localStorage.getItem('phone_analysis_user');
        
        if (token && user) {
            console.log('User already authenticated, redirecting to app');
            // Redirect to app page
            window.location.href = 'app.html';
        } else {
            console.log('User not authenticated, showing login form');
        }
    }
    
    /**
     * Xử lý đăng nhập
     * @private
     */
    function handleLogin() {
        console.log('Handle login triggered');
        
        if (!elements.loginEmail || !elements.loginPassword || !elements.loginMessage) {
            console.error('Login form elements not found');
            return;
        }
        
        const email = elements.loginEmail.value.trim();
        const password = elements.loginPassword.value;
        
        // Validate inputs
        if (!email) {
            setLoginMessage('Vui lòng nhập email', 'error');
            elements.loginEmail.focus();
            return;
        }
        
        if (!password) {
            setLoginMessage('Vui lòng nhập mật khẩu', 'error');
            elements.loginPassword.focus();
            return;
        }
        
        console.log('Login attempt with email:', email);
        
        // Display processing message
        setLoginMessage('Đang đăng nhập...', 'info');
        
        // Disable login button
        if (elements.loginButton) {
            elements.loginButton.disabled = true;
        }
        
        // Show loading
        setLoading(true);
        
        // Emit login event
        console.log('Publishing auth:login event');
        EventBus.publish('auth:login', { email, password });
        
        // Try direct login if event system isn't working
        try {
            // This might help when event system isn't fully initialized
            AuthController.login(email, password)
                .then(result => {
                    console.log('Direct login result:', result);
                    if (result.success) {
                        handleLoginSuccess(result);
                    } else {
                        handleLoginFailed(result);
                    }
                })
                .catch(error => {
                    console.error('Direct login error:', error);
                    handleLoginFailed({ error: error.message });
                });
        } catch (error) {
            console.error('Error calling direct login:', error);
        }
    }
    
    /**
     * Xử lý kết quả đăng nhập thành công
     * @param {Object} result - Kết quả đăng nhập
     */
    function handleLoginSuccess(result) {
        console.log('Login successful:', result);
        
        // Re-enable login button
        if (elements.loginButton) {
            elements.loginButton.disabled = false;
        }
        
        // Hide loading
        setLoading(false);
        
        // Show success message
        setLoginMessage('Đăng nhập thành công! Đang chuyển hướng...', 'success');
        
        // Redirect to app page
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1000);
    }
    
    /**
     * Xử lý kết quả đăng nhập thất bại
     * @param {Object} result - Kết quả đăng nhập
     */
    function handleLoginFailed(result) {
        console.error('Login failed:', result);
        
        // Re-enable login button
        if (elements.loginButton) {
            elements.loginButton.disabled = false;
        }
        
        // Hide loading
        setLoading(false);
        
        // Show error message
        setLoginMessage(result.error || 'Đăng nhập thất bại', 'error');
        
        // Clear password field
        if (elements.loginPassword) {
            elements.loginPassword.value = '';
            elements.loginPassword.focus();
        }
    }
    
    /**
     * Đặt nội dung thông báo đăng nhập
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo (error, success, info)
     */
    function setLoginMessage(message, type = 'error') {
        if (!elements.loginMessage) return;
        
        elements.loginMessage.textContent = message;
        
        // Reset classes
        elements.loginMessage.className = 'auth-message';
        
        // Apply color based on type
        switch (type) {
            case 'success':
                elements.loginMessage.style.color = 'var(--success-color)';
                break;
            case 'info':
                elements.loginMessage.style.color = 'var(--text-secondary)';
                break;
            case 'error':
            default:
                elements.loginMessage.style.color = 'var(--danger-color)';
                break;
        }
    }
    
    /**
     * Xử lý đăng ký
     * @private
     */
    function handleRegister() {
        console.log('Handle register triggered');
        
        if (!elements.registerName || !elements.registerEmail || 
            !elements.registerPassword || !elements.registerMessage) {
            console.error('Register form elements not found');
            return;
        }
        
        const name = elements.registerName.value.trim();
        const email = elements.registerEmail.value.trim();
        const password = elements.registerPassword.value;
        
        // Validate inputs
        if (!name) {
            setRegisterMessage('Vui lòng nhập tên', 'error');
            elements.registerName.focus();
            return;
        }
        
        if (!email) {
            setRegisterMessage('Vui lòng nhập email', 'error');
            elements.registerEmail.focus();
            return;
        }
        
        if (!password) {
            setRegisterMessage('Vui lòng nhập mật khẩu', 'error');
            elements.registerPassword.focus();
            return;
        }
        
        if (password.length < 6) {
            setRegisterMessage('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            elements.registerPassword.focus();
            return;
        }
        
        console.log('Register attempt with email:', email);
        
        // Display processing message
        setRegisterMessage('Đang đăng ký...', 'info');
        
        // Disable register button
        if (elements.registerButton) {
            elements.registerButton.disabled = true;
        }
        
        // Show loading
        setLoading(true);
        
        // Emit register event
        console.log('Publishing auth:register event');
        EventBus.publish('auth:register', { name, email, password });
        
        // Try direct register if event system isn't working
        try {
            // This might help when event system isn't fully initialized
            AuthController.register(name, email, password)
                .then(result => {
                    console.log('Direct register result:', result);
                    if (result.success) {
                        handleRegisterSuccess(result);
                    } else {
                        handleRegisterFailed(result);
                    }
                })
                .catch(error => {
                    console.error('Direct register error:', error);
                    handleRegisterFailed({ error: error.message });
                });
        } catch (error) {
            console.error('Error calling direct register:', error);
        }
    }
    
    /**
     * Xử lý kết quả đăng ký thành công
     * @param {Object} result - Kết quả đăng ký
     */
    function handleRegisterSuccess(result) {
        console.log('Register successful:', result);
        
        // Re-enable register button
        if (elements.registerButton) {
            elements.registerButton.disabled = false;
        }
        
        // Hide loading
        setLoading(false);
        
        // Show success message
        setRegisterMessage('Đăng ký thành công! Đang chuyển hướng...', 'success');
        
        // Redirect to app page
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1000);
    }
    
    /**
     * Xử lý kết quả đăng ký thất bại
     * @param {Object} result - Kết quả đăng ký
     */
    function handleRegisterFailed(result) {
        console.error('Register failed:', result);
        
        // Re-enable register button
        if (elements.registerButton) {
            elements.registerButton.disabled = false;
        }
        
        // Hide loading
        setLoading(false);
        
        // Show error message
        setRegisterMessage(result.error || 'Đăng ký thất bại', 'error');
    }
    
    /**
     * Đặt nội dung thông báo đăng ký
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo (error, success, info)
     */
    function setRegisterMessage(message, type = 'error') {
        if (!elements.registerMessage) return;
        
        elements.registerMessage.textContent = message;
        
        // Reset classes
        elements.registerMessage.className = 'auth-message';
        
        // Apply color based on type
        switch (type) {
            case 'success':
                elements.registerMessage.style.color = 'var(--success-color)';
                break;
            case 'info':
                elements.registerMessage.style.color = 'var(--text-secondary)';
                break;
            case 'error':
            default:
                elements.registerMessage.style.color = 'var(--danger-color)';
                break;
        }
    }
    
    /**
     * Chuyển đổi giữa các tab đăng nhập/đăng ký
     * @param {string} tabName - Tên tab ('login' hoặc 'register')
     */
    function switchAuthTab(tabName) {
        console.log('Switching to auth tab:', tabName);
        
        if (!elements.authTabs || !elements.loginForm || !elements.registerForm) {
            console.error('Auth tabs or forms not found');
            return;
        }
        
        // Update tab buttons
        elements.authTabs.forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetButton = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // Update forms
        elements.loginForm.classList.remove('active');
        elements.registerForm.classList.remove('active');
        
        if (tabName === 'login') {
            elements.loginForm.classList.add('active');
        } else if (tabName === 'register') {
            elements.registerForm.classList.add('active');
        }
        
        // Update title
        const authHeader = document.querySelector('.auth-header h3');
        if (authHeader) {
            authHeader.textContent = tabName === 'login' ? 'Đăng Nhập' : 'Đăng Ký';
        }
        
        console.log('Auth tab switched to:', tabName);
    }
    
    /**
     * Hiển thị thông báo lỗi bên ngoài form
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo ('error', 'success', 'info')
     */
    function showNotification(message, type = 'error') {
        console.log('Showing notification:', message, 'type:', type);
        
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
        console.log('Setting loading state:', isLoading);
        
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
    
    // Khởi tạo LoginView
    init();
    
    // Public API
    return {
        init,
        showNotification,
        setLoading,
        switchAuthTab
    };
})();

// Export LoginView
export default LoginView;