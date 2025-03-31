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
            initializeControllers();
            
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
    
    // Kiểm tra chính xác hơn bằng cách sử dụng cả pathname và filename
    if (pathname.includes('app.html') || pathname.endsWith('/app')) {
        return 'app';
    } else if (pathname.includes('login.html') || pathname.endsWith('/login')) {
        return 'login';
    } else if (pathname.includes('landing.html') || pathname.includes('index.html') || pathname === '/' || pathname.endsWith('/landing')) {
        return 'landing';
    }
    
    // Kiểm tra nếu pathname không chứa filename (có thể là vì URL được rewrite)
    const noExtension = !pathname.includes('.html');
    if (noExtension) {
        // Kiểm tra bằng end of path
        const pathParts = pathname.split('/').filter(Boolean);
        const lastPath = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
        
        if (lastPath === 'app') return 'app';
        if (lastPath === 'login') return 'login';
        if (lastPath === 'landing' || lastPath === '') return 'landing';
    }
    
    // Log để debug
    console.log('Current pathname:', pathname);
    
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
            
            // Các service khác có thể không có phương thức init, kiểm tra trước khi gọi
            if (typeof AnalysisService.init === 'function') {
                AnalysisService.init();
            }
            
            if (typeof ChatService.init === 'function') {
                ChatService.init();
            }
            
            console.log('Services initialized successfully');
        } catch (error) {
            console.error('Error initializing services:', error);
            throw new Error('Service initialization failed: ' + error.message);
        }
    }
    

/**
 * Khởi tạo các controllers
 */
async function initializeControllers() {
    console.log('Initializing controllers...');
    
    try {
        // Khởi tạo các controllers theo thứ tự phụ thuộc
        // Khởi tạo AuthController trước
        await AuthController.init();
        
        // Kiểm tra xem đang ở trang nào
        const currentPage = detectCurrentPage();
        
        // Chỉ khởi tạo các controller cần thiết cho trang hiện tại
        if (currentPage === 'app') {
            // UIController là class, cần tạo instance
            window.uiController = new UIController(ApiService);
            window.uiController.init();
            
            // Khởi tạo các controller khác
            if (typeof AnalysisController.init === 'function') {
                AnalysisController.init();
            }
            
            if (typeof ChatController.init === 'function') {
                ChatController.init();
            }
            
            if (typeof AppController.init === 'function') {
                AppController.init();
            }
        } else if (currentPage === 'login') {
            // Khởi tạo các controller cần thiết cho trang login
            // ...
        } else if (currentPage === 'landing') {
            // Khởi tạo các controller cần thiết cho trang landing
            // ...
        }
        
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
                    if (typeof AppView.init === 'function') {
                        AppView.init();
                    }
                    break;
                    
                case 'login':
                    // LoginView đã tự khởi tạo
                    // LoginView.init();
                    break;
                    
                case 'landing':
                    if (typeof LandingView.init === 'function') {
                        LandingView.init();
                    }
                    break;
                    
                default:
                    if (typeof LandingView.init === 'function') {
                        LandingView.init();
                    }
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