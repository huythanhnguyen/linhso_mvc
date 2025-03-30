// src/controllers/AppController.js (tiếp tục)

/**
 * AppController - Điểm khởi đầu của ứng dụng
 * Quản lý tất cả các controller
 */
class AppController {
    /**
     * Khởi tạo AppController
     * @param {AuthController} authController - Controller xác thực
     * @param {UIController} uiController - Controller UI
     * @param {ChatController} chatController - Controller chat
     */
    constructor(authController, uiController, chatController) {
        this.authController = authController;
        this.uiController = uiController;
        this.chatController = chatController;
        
        // Trạng thái ứng dụng
        this.state = {
            initialized: false,
            loading: true
        };
    }

    /**
     * Khởi chạy ứng dụng
     */
    async start() {
        if (this.state.initialized) return;
        
        try {
            console.log('Đang khởi chạy ứng dụng...');
            
            // Hiển thị loading
            this._showLoading();
            
            // Thiết lập các sự kiện
            this._setupEventListeners();
            
            // Khởi tạo AuthController
            const authResult = await this.authController.init();
            console.log('Kết quả khởi tạo Auth:', authResult);
            
            // Khởi tạo UIController
            this.uiController.init();
            
            // Kiểm tra trạng thái xác thực và hiển thị màn hình phù hợp
            this._checkAuthAndShowContainer(authResult.authenticated);
            
            // Khởi tạo ChatController nếu đã xác thực
            if (authResult.authenticated) {
                this.chatController.init();
            }
            
            // Ứng dụng đã khởi tạo thành công
            this.state.initialized = true;
            console.log('Khởi chạy ứng dụng thành công');
            
            // Ẩn loading
            this._hideLoading();
        } catch (error) {
            console.error('Lỗi khởi chạy ứng dụng:', error);
            this._showErrorMessage('Không thể khởi chạy ứng dụng. Vui lòng tải lại trang.');
            this._hideLoading();
        }
    }

    /**
     * Thiết lập các sự kiện
     * @private
     */
    _setupEventListeners() {
        // Lắng nghe sự kiện thay đổi trạng thái xác thực
        this.authController.addAuthStateListener(this._handleAuthStateChanged.bind(this));
        
        // Lắng nghe sự kiện gửi tin nhắn
        document.addEventListener('messageSent', this._handleMessageSent.bind(this));
        
        // Lắng nghe sự kiện click vào mục lịch sử
        document.addEventListener('historyItemClicked', this._handleHistoryItemClicked.bind(this));
        
        // Lắng nghe sự kiện xóa chat
        document.addEventListener('clearChat', this._handleClearChat.bind(this));
        
        // Lắng nghe sự kiện lỗi xác thực
        document.addEventListener('authError', this._handleAuthError.bind(this));
        
        // Lắng nghe sự kiện resize
        window.addEventListener('resize', this._handleResize.bind(this));
    }

    /**
     * Xử lý khi trạng thái xác thực thay đổi
     * @param {boolean} isAuthenticated - Trạng thái xác thực
     * @param {Object} user - Thông tin người dùng
     * @private
     */
    _handleAuthStateChanged(isAuthenticated, user) {
        console.log('Trạng thái xác thực thay đổi:', isAuthenticated ? 'Đã đăng nhập' : 'Chưa đăng nhập');
        this._checkAuthAndShowContainer(isAuthenticated);
        
        // Khởi tạo lại ChatController nếu đăng nhập
        if (isAuthenticated && !this.chatController.state.initialized) {
            this.chatController.init();
        }
    }

    /**
     * Xử lý khi có tin nhắn được gửi
     * @param {CustomEvent} event - Sự kiện tin nhắn
     * @private
     */
    _handleMessageSent(event) {
        const { text } = event.detail;
        
        // Gửi tin nhắn tới ChatController để xử lý
        this.chatController.processUserInput(text);
    }

    /**
     * Xử lý khi click vào mục lịch sử
     * @param {CustomEvent} event - Sự kiện click
     * @private
     */
    _handleHistoryItemClicked(event) {
        const { phoneNumber } = event.detail;
        
        // Gửi số điện thoại tới ChatController để xử lý
        this.chatController.processUserInput(phoneNumber);
    }

    /**
     * Xử lý khi xóa chat
     * @private
     */
    _handleClearChat() {
        // Xóa lịch sử trong ChatController
        this.chatController.clearHistory();
    }

    /**
     * Xử lý khi có lỗi xác thực
     * @param {CustomEvent} event - Sự kiện lỗi
     * @private
     */
    _handleAuthError(event) {
        const { message } = event.detail;
        
        // Hiển thị thông báo lỗi
        this._showAuthErrorMessage(message);
        
        // Chuyển đến màn hình đăng nhập
        this._checkAuthAndShowContainer(false);
    }

    /**
     * Xử lý khi cửa sổ thay đổi kích thước
     * @private
     */
    _handleResize() {
        // Có thể thực hiện các điều chỉnh bổ sung khi cửa sổ thay đổi kích thước
    }

    /**
     * Kiểm tra trạng thái xác thực và hiển thị màn hình phù hợp
     * @param {boolean} isAuthenticated - Trạng thái xác thực
     * @private
     */
    _checkAuthAndShowContainer(isAuthenticated) {
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        const landingPage = document.getElementById('landing-page');
        
        if (!authContainer || !appContainer || !landingPage) {
            console.error('Không tìm thấy các container cần thiết!');
            return;
        }
        
        // Ẩn tất cả container
        authContainer.style.display = 'none';
        appContainer.style.display = 'none';
        landingPage.style.display = 'none';
        
        if (isAuthenticated) {
            // Nếu đã đăng nhập: hiển thị ứng dụng
            appContainer.style.display = 'flex';
            document.body.classList.add('authenticated');
            
            // Cập nhật thông tin người dùng trên giao diện
            this._updateUserInfo();
            
            // Tải lại lịch sử phân tích
            this.uiController.loadAnalysisHistory().catch(error => {
                console.error('Lỗi tải lịch sử:', error);
            });
        } else {
            // Nếu chưa đăng nhập: hiển thị landing page
            landingPage.style.display = 'flex';
            document.body.classList.add('landing-mode');
        }
    }

    /**
     * Cập nhật thông tin người dùng trên giao diện
     * @private
     */
    _updateUserInfo() {
        const currentUser = this.authController.getCurrentUser();
        
        if (currentUser) {
            const userNameElement = document.getElementById('user-name-welcome');
            const accountNameElement = document.getElementById('account-name');
            const accountEmailElement = document.getElementById('account-email');
            const accountCreatedElement = document.getElementById('account-created');
            
            if (userNameElement) {
                userNameElement.textContent = currentUser.name || 'Người dùng';
            }
            
            if (accountNameElement) {
                accountNameElement.textContent = currentUser.name || 'Người dùng';
            }
            
            if (accountEmailElement) {
                accountEmailElement.textContent = currentUser.email || '';
            }
            
            if (accountCreatedElement && currentUser.createdAt) {
                const createdDate = new Date(currentUser.createdAt);
                accountCreatedElement.textContent = createdDate.toLocaleDateString('vi-VN');
            }
        }
    }

    /**
     * Hiển thị loading
     * @private
     */
    _showLoading() {
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = 'flex';
        }
        
        this.state.loading = true;
    }

    /**
     * Ẩn loading
     * @private
     */
    _hideLoading() {
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        
        this.state.loading = false;
    }

    /**
     * Hiển thị thông báo lỗi
     * @param {string} message - Nội dung lỗi
     * @private
     */
    _showErrorMessage(message) {
        // Tạo phần tử lỗi nếu chưa tồn tại
        let errorElement = document.getElementById('app-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'app-error';
            errorElement.style.position = 'fixed';
            errorElement.style.top = '10px';
            errorElement.style.left = '50%';
            errorElement.style.transform = 'translateX(-50%)';
            errorElement.style.backgroundColor = 'var(--danger-color, #f44336)';
            errorElement.style.color = 'white';
            errorElement.style.padding = '10px 20px';
            errorElement.style.borderRadius = 'var(--radius-md, 8px)';
            errorElement.style.boxShadow = 'var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.1))';
            errorElement.style.zIndex = '9999';
            errorElement.style.maxWidth = '80%';
            errorElement.style.textAlign = 'center';
            
            document.body.appendChild(errorElement);
        }
        
        // Cập nhật nội dung lỗi
        errorElement.textContent = message;
        
        // Thêm nút đóng
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.marginLeft = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontWeight = 'bold';
        closeButton.addEventListener('click', function() {
            errorElement.remove();
        });
        
        errorElement.appendChild(closeButton);
        
        // Tự động xóa sau 10 giây
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 10000);
    }

    /**
     * Hiển thị thông báo lỗi xác thực
     * @param {string} message - Nội dung lỗi
     * @private
     */
    _showAuthErrorMessage(message) {
        // Tạo phần tử thông báo lỗi
        let errorElement = document.getElementById('auth-error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'auth-error-message';
            errorElement.className = 'auth-error-message';
            
            // Định dạng
            errorElement.style.backgroundColor = 'var(--danger-light, #ffebee)';
            errorElement.style.color = 'var(--danger-color, #f44336)';
            errorElement.style.padding = '10px 15px';
            errorElement.style.borderRadius = 'var(--radius-md, 8px)';
            errorElement.style.marginBottom = '15px';
            errorElement.style.textAlign = 'center';
            errorElement.style.fontWeight = '500';
            errorElement.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
            errorElement.style.borderLeft = '3px solid var(--danger-color, #f44336)';
            errorElement.style.animation = 'fadeIn 0.3s ease-out';
            
            // Thêm vào auth container
            const authContainer = document.querySelector('.auth-box');
            if (authContainer) {
                authContainer.insertBefore(errorElement, authContainer.firstChild);
            }
        }
        
        // Cập nhật nội dung
        errorElement.textContent = message;
        
        // Tự động ẩn sau 15 giây
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.style.opacity = '0';
                errorElement.style.transition = 'opacity 0.5s ease';
                
                setTimeout(() => {
                    if (errorElement.parentNode) {
                        errorElement.parentNode.removeChild(errorElement);
                    }
                }, 500);
            }
        }, 15000);
    }
}

export default AppController;