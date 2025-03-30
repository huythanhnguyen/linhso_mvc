/**
 * LoginView
 * Quản lý hiển thị và tương tác trên trang đăng nhập
 */

import EventBus from '../../core/EventBus.js';
import FormsView from '../components/FormsView.js';

const LoginView = (function() {
    // Cache DOM elements
    let elements = {};
    
    /**
     * Khởi tạo view
     */
    function init() {
        // Cache DOM elements
        elements = {
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            backToHomeLink: document.querySelector('.back-to-home'),
            loadingContainer: document.getElementById('loading-container')
        };
        
        // Hide loading screen
        if (elements.loadingContainer) {
            elements.loadingContainer.style.display = 'none';
        }
        
        // Initialize forms view
        FormsView.init();
        
        // Check for auto-redirect
        checkAuthStatus();
    }
    
    /**
     * Kiểm tra trạng thái xác thực và chuyển hướng nếu cần
     * @private
     */
    function checkAuthStatus() {
        // Check if token exists in localStorage
        const token = localStorage.getItem('phone_analysis_token');
        const user = localStorage.getItem('phone_analysis_user');
        
        if (token && user) {
            // Redirect to app page
            window.location.href = 'app.html';
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
        setLoading
    };
})();

export default LoginView;