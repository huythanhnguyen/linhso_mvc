/**
 * AppView
 * Quản lý hiển thị và tương tác tổng thể trên trang ứng dụng chính
 */

import EventBus from '../../core/EventBus.js';
import ChatView from '../components/ChatView.js';
import SidebarView from '../components/SidebarView.js';
import HeaderView from '../components/HeaderView.js';
import ModalView from '../components/ModalView.js';

const AppView = (function() {
    // Cache DOM elements
    let elements = {};
    
    /**
     * Khởi tạo view
     */
    function init() {
        // Cache DOM elements
        elements = {
            appContainer: document.getElementById('app-container'),
            loadingContainer: document.getElementById('loading-container'),
            mainContent: document.querySelector('.main-content')
        };
        
        // Initialize components
        ChatView.init();
        SidebarView.init();
        HeaderView.init();
        ModalView.init();
        
        // Set up window resize event
        window.addEventListener('resize', handleResize);
        
        // Set up window load event
        window.addEventListener('load', function() {
            // Ensure proper container display
            if (elements.appContainer) {
                elements.appContainer.style.display = 'flex';
            }
            
            // Hide loading container
            if (elements.loadingContainer) {
                elements.loadingContainer.style.display = 'none';
            }
        });
        
        // Check authentication status
        checkAuthStatus();
        
        // Initial resize handling
        handleResize();
        
        // Subscribe to events
        EventBus.subscribe('app:setLoading', setLoading);
    }
    
    /**
     * Kiểm tra trạng thái xác thực và chuyển hướng nếu cần
     * @private
     */
    function checkAuthStatus() {
        // Check if token exists in localStorage
        const token = localStorage.getItem('phone_analysis_token');
        if (!token) {
            // Redirect to landing page
            window.location.href = 'landingpage.html';
        }
    }
    
    /**
     * Xử lý thay đổi kích thước cửa sổ
     * @private
     */
    function handleResize() {
        // Close sidebar on mobile when resizing to desktop
        if (window.innerWidth > 992) {
            SidebarView.closeSidebar();
        }
        
        // Adjust heights for mobile
        if (window.innerWidth <= 768) {
            // Mobile adjustments if needed
        }
    }
    
    /**
     * Đặt trạng thái loading
     * @param {boolean} isLoading - Trạng thái loading
     */
    function setLoading(isLoading) {
        if (elements.loadingContainer) {
            elements.loadingContainer.style.display = isLoading ? 'flex' : 'none';
        }
        
        // Disable/enable buttons and inputs when loading
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input, textarea');
        
        buttons.forEach(button => {
            button.disabled = isLoading;
        });
        
        inputs.forEach(input => {
            input.disabled = isLoading;
        });
    }
    
    /**
     * Hiển thị thông báo cho người dùng
     * @param {Object} options - Tùy chọn thông báo
     */
    function showNotification(options) {
        const defaults = {
            message: '',
            type: 'info', // 'info', 'success', 'warning', 'error'
            duration: 5000,
            position: 'top' // 'top', 'bottom'
        };
        
        const settings = { ...defaults, ...options };
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `app-notification ${settings.type} ${settings.position}`;
        notification.textContent = settings.message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(notification);
        });
        
        notification.appendChild(closeBtn);
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-hide after duration
        if (settings.duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, settings.duration);
        }
        
        return notification;
    }
    
    return {
        init,
        setLoading,
        showNotification
    };
})();

export default AppView;