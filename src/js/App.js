/**
 * App.js - Main Application Entry Point
 * Khởi tạo và kết nối các thành phần của ứng dụng
 */

import Config from './core/Config.js';
import EventBus from './core/EventBus.js';
import Utils from './core/Utils.js';
import Storage from './core/Storage.js';

// Controllers
import AuthController from './controllers/AuthController.js';
import ChatController from './controllers/ChatController.js';
import AnalysisController from './controllers/AnalysisController.js';
import UIController from './controllers/UIController.js';
import AppController from './controllers/AppController.js';

// Services
import ApiService from './services/ApiService.js';
import StorageService from './services/StorageService.js';
import AnalysisService from './services/AnalysisService.js';
import ChatService from './services/ChatService.js';

// Views
import AppView from './views/pages/AppView.js';
import LoginView from './views/pages/LoginView.js';
import LandingView from './views/pages/LandingView.js';

const App = (function() {
    /**
     * Khởi tạo ứng dụng
     */
    function init() {
        console.log('Initializing application...');
        
        try {
            // Nhận diện trang hiện tại
            const currentPage = detectCurrentPage();
            console.log('Current page:', currentPage);
            
            // Khởi tạo Services
            initializeServices();
            
            // Khởi tạo Controllers
          
            function initializeControllers() {
                console.log('Initializing controllers...');
                
                // Đảm bảo dòng này tồn tại và được gọi
                AuthController.init();
                
                // Thêm đăng ký sự kiện nếu cần
                EventBus.subscribe('auth:login', function(data) {
                    console.log('Auth:login event captured in App.js', data);
                    AuthController.login(data.email, data.password);
                });
            }
            
            // Khởi tạo View dựa vào trang hiện tại
            initializeView(currentPage);
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            displayErrorMessage('Khởi tạo ứng dụng thất bại. Vui lòng tải lại trang.');
        }
    }
    
    /**
     * Phát hiện trang hiện tại dựa vào URL
     * @returns {string} Tên trang ('app', 'login', 'landing')
     */
    function detectCurrentPage() {
        const pathname = window.location.pathname;
        
        if (pathname.includes('app.html')) {
            return 'app';
        } else if (pathname.includes('login.html')) {
            return 'login';
        } else if (pathname.includes('landingpage.html') || pathname.includes('index.html') || pathname === '/') {
            return 'landing';
        }
        
        // Mặc định
        return 'landing';
    }
    
    /**
     * Khởi tạo các services
     */
    function initializeServices() {
        console.log('Initializing services...');
        
        try {
            // Khởi tạo các services theo thứ tự phụ thuộc
            ApiService.init(Config.API_BASE_URL);
            StorageService.init();
            AnalysisService.init();
            ChatService.init();
            
            console.log('Services initialized successfully');
        } catch (error) {
            console.error('Error initializing services:', error);
            throw new Error('Service initialization failed: ' + error.message);
        }
    }
    
    /**
     * Khởi tạo các controllers
     */
    function initializeControllers() {
        console.log('Initializing controllers...');
        
        try {
            // Khởi tạo các controllers theo thứ tự phụ thuộc
            AuthController.init();
            UIController.init();
            AnalysisController.init();
            ChatController.init();
            AppController.init();
            
            console.log('Controllers initialized successfully');
        } catch (error) {
            console.error('Error initializing controllers:', error);
            throw new Error('Controller initialization failed: ' + error.message);
        }
    }
    
    /**
     * Khởi tạo view dựa vào trang hiện tại
     * @param {string} page - Tên trang hiện tại
     */
    function initializeView(page) {
        console.log(`Initializing ${page} view...`);
        
        try {
            switch (page) {
                case 'app':
                    AppView.init();
                    break;
                    
                case 'login':
                    LoginView.init();
                    break;
                    
                case 'landing':
                    LandingView.init();
                    break;
                    
                default:
                    LandingView.init();
                    break;
            }
            
            console.log(`${page} view initialized successfully`);
        } catch (error) {
            console.error(`Error initializing ${page} view:`, error);
            throw new Error('View initialization failed: ' + error.message);
        }
    }
    
    /**
     * Hiển thị thông báo lỗi
     * @param {string} message - Nội dung thông báo
     */
    function displayErrorMessage(message) {
        // Tạo phần tử hiển thị lỗi
        const errorElement = document.createElement('div');
        errorElement.style.position = 'fixed';
        errorElement.style.top = '10px';
        errorElement.style.left = '50%';
        errorElement.style.transform = 'translateX(-50%)';
        errorElement.style.backgroundColor = '#f44336';
        errorElement.style.color = 'white';
        errorElement.style.padding = '10px 20px';
        errorElement.style.borderRadius = '4px';
        errorElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        errorElement.style.zIndex = '9999';
        errorElement.style.textAlign = 'center';
        
        errorElement.textContent = message;
        
        // Thêm nút đóng
        const closeButton = document.createElement('button');
        closeButton.style.marginLeft = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = 'white';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontWeight = 'bold';
        closeButton.textContent = '×';
        
        closeButton.addEventListener('click', function() {
            document.body.removeChild(errorElement);
        });
        
        errorElement.appendChild(closeButton);
        document.body.appendChild(errorElement);
        
        // Tự động ẩn sau 10 giây
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 10000);
    }
    
    return {
        init
    };
})();

// Khởi tạo ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

export default App;