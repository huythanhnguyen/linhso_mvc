// src/services/StorageService.js

/**
 * StorageService - Quản lý lưu trữ cục bộ
 * Xử lý tất cả hoạt động với localStorage
 */
class StorageService {
    /**
     * Khởi tạo StorageService
     * @returns {boolean} Trạng thái khởi tạo
     */
    static init() {
        console.log('Initializing StorageService...');
        try {
            // Kiểm tra xem localStorage có khả dụng không
            if (this.isAvailable()) {
                console.log('StorageService initialized successfully, localStorage is available');
                return true;
            } else {
                console.warn('StorageService initialized, but localStorage is not available');
                return false;
            }
        } catch (error) {
            console.error('Error initializing StorageService:', error);
            return false;
        }
    }

    /**
     * Lấy dữ liệu từ localStorage
     * @param {string} key - Khóa cần lấy
     * @returns {string|null} Giá trị lưu trữ
     */
    static getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Error getting item '${key}' from localStorage:`, error);
            return null;
        }
    }

    /**
     * Lưu dữ liệu vào localStorage
     * @param {string} key - Khóa cần lưu
     * @param {string} value - Giá trị cần lưu
     * @returns {boolean} Kết quả lưu
     */
    static setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Error setting item '${key}' in localStorage:`, error);
            return false;
        }
    }

    /**
     * Xóa dữ liệu từ localStorage
     * @param {string} key - Khóa cần xóa
     * @returns {boolean} Kết quả xóa
     */
    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing item '${key}' from localStorage:`, error);
            return false;
        }
    }

    /**
     * Lấy đối tượng JSON từ localStorage
     * @param {string} key - Khóa cần lấy
     * @returns {Object|null} Đối tượng đã phân tích
     */
    static getObject(key) {
        const data = this.getItem(key);
        
        if (!data) return null;
        
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error parsing JSON from localStorage key '${key}':`, error);
            return null;
        }
    }

    /**
     * Lưu đối tượng JSON vào localStorage
     * @param {string} key - Khóa cần lưu
     * @param {Object} object - Đối tượng cần lưu
     * @returns {boolean} Kết quả lưu
     */
    static setObject(key, object) {
        try {
            const json = JSON.stringify(object);
            return this.setItem(key, json);
        } catch (error) {
            console.error(`Error stringifying object for localStorage key '${key}':`, error);
            return false;
        }
    }

    /**
     * Kiểm tra xem localStorage có khả dụng không
     * @returns {boolean} Kết quả kiểm tra
     */
    static isAvailable() {
        try {
            const testKey = '_storage_test_';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Xóa tất cả dữ liệu trong localStorage
     * @returns {boolean} Kết quả xóa
     */
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
}

export default StorageService;