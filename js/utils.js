// Utility Functions
const utils = {
    
    // ==================== ID GENERATION ====================
    
    /**
     * สร้าง ID แบบสุ่มที่ปลอดภัย
     * @returns {string} ID ที่สร้างแบบสุ่ม
     */
    generateId: function() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 9);
        return `id_${timestamp}_${randomStr}`;
    },

    /**
     * สร้าง UUID version 4
     * @returns {string} UUID
     */
    generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // ==================== DATE & TIME ====================

    /**
     * ฟอร์แมตวันที่เป็นรูปแบบไทย
     * @param {string} dateString - วันที่ในรูปแบบ ISO string
     * @param {boolean} includeTime - รวมเวลาหรือไม่
     * @returns {string} วันที่ที่ฟอร์แมตแล้ว
     */
    formatDate: function(dateString, includeTime = true) {
        try {
            const date = new Date(dateString);
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Bangkok'
            };
            
            if (includeTime) {
                options.hour = '2-digit';
                options.minute = '2-digit';
            }
            
            return date.toLocaleDateString('th-TH', options);
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'วันที่ไม่ถูกต้อง';
        }
    },

    /**
     * คำนวณเวลาที่ผ่านมา (เช่น "2 นาทีที่แล้ว")
     * @param {string} dateString - วันที่ในรูปแบบ ISO string
     * @returns {string} เวลาที่ผ่านมา
     */
    timeAgo: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffYears > 0) {
            return `${diffYears} ปีที่แล้ว`;
        } else if (diffMonths > 0) {
            return `${diffMonths} เดือนที่แล้ว`;
        } else if (diffDays > 0) {
            return `${diffDays} วันที่แล้ว`;
        } else if (diffHours > 0) {
            return `${diffHours} ชั่วโมงที่แล้ว`;
        } else if (diffMins > 0) {
            return `${diffMins} นาทีที่แล้ว`;
        } else {
            return 'ไม่กี่วินาทีที่แล้ว';
        }
    },

    /**
     * ฟอร์แมตระยะเวลา (เช่น "2:30:15")
     * @param {number} milliseconds - เวลาในมิลลิวินาที
     * @returns {string} ระยะเวลาที่ฟอร์แมตแล้ว
     */
    formatDuration: function(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    },

    // ==================== STRING MANIPULATION ====================

    /**
     * จำกัดความยาวข้อความและเพิ่ม ...
     * @param {string} text - ข้อความต้นฉบับ
     * @param {number} maxLength - ความยาวสูงสุด
     * @returns {string} ข้อความที่ถูกตัดแล้ว
     */
    truncateText: function(text, maxLength = 50) {
        if (typeof text !== 'string') return text;
        if (text.length <= maxLength) return text;
        
        return text.substr(0, maxLength).trim() + '...';
    },

    /**
     * แปลงข้อความเป็นรูปแบบ title case
     * @param {string} text - ข้อความต้นฉบับ
     * @returns {string} ข้อความในรูปแบบ title case
     */
    toTitleCase: function(text) {
        if (typeof text !== 'string') return text;
        
        return text.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    },

    /**
     * ลบ whitespace ที่ไม่จำเป็น
     * @param {string} text - ข้อความต้นฉบับ
     * @returns {string} ข้อความที่ลบ whitespace แล้ว
     */
    normalizeWhitespace: function(text) {
        if (typeof text !== 'string') return text;
        return text.replace(/\s+/g, ' ').trim();
    },

    /**
     * ตรวจสอบว่าเป็น string ที่ว่างเปล่าหรือไม่
     * @param {string} text - ข้อความที่จะตรวจสอบ
     * @returns {boolean} true ถ้าว่างเปล่า
     */
    isEmptyString: function(text) {
        return typeof text !== 'string' || text.trim() === '';
    },

    // ==================== URL HANDLING ====================

    /**
     * ดึงชื่อไฟล์จาก URL
     * @param {string} url - URL ของไฟล์
     * @returns {string} ชื่อไฟล์
     */
    getFilenameFromURL: function(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            
            // ถ้าไม่มีชื่อไฟล์ใน path ให้ใช้ชื่อจาก query parameters หรือส่งคืนค่า default
            if (!filename || filename === pathname) {
                // พยายามดึงชื่อจาก query parameters
                const nameFromQuery = urlObj.searchParams.get('filename') || 
                                    urlObj.searchParams.get('name') ||
                                    urlObj.searchParams.get('file');
                
                return nameFromQuery || 'รูปภาพจาก URL';
            }
            
            // ถอดรหัส URL encoded characters
            return decodeURIComponent(filename) || 'รูปภาพจาก URL';
        } catch (_) {
            return 'รูปภาพจาก URL';
        }
    },

    /**
     * ตรวจสอบว่าเป็น URL ที่ถูกต้อง
     * @param {string} string - สตริงที่จะตรวจสอบ
     * @returns {boolean} true ถ้าเป็น URL ที่ถูกต้อง
     */
    isValidURL: function(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    },

    /**
     * แยกส่วนต่างๆ ของ URL
     * @param {string} url - URL ที่จะแยก
     * @returns {Object} object ที่มีส่วนต่างๆ ของ URL
     */
    parseURL: function(url) {
        try {
            const urlObj = new URL(url);
            return {
                protocol: urlObj.protocol,
                hostname: urlObj.hostname,
                port: urlObj.port,
                pathname: urlObj.pathname,
                search: urlObj.search,
                hash: urlObj.hash,
                origin: urlObj.origin
            };
        } catch (error) {
            console.error('URL parsing error:', error);
            return null;
        }
    },

    // ==================== FILE HANDLING ====================

    /**
     * ดึงนามสกุลไฟล์จากชื่อไฟล์
     * @param {string} filename - ชื่อไฟล์
     * @returns {string} นามสกุลไฟล์
     */
    getFileExtension: function(filename) {
        if (typeof filename !== 'string') return '';
        
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },

    /**
     * ฟอร์แมตขนาดไฟล์ (เช่น "2.5 MB")
     * @param {number} bytes - ขนาดไฟล์ใน bytes
     * @returns {string} ขนาดไฟล์ที่ฟอร์แมตแล้ว
     */
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * ตรวจสอบประเภทไฟล์จาก MIME type
     * @param {string} mimeType - MIME type
     * @returns {string} ประเภทไฟล์
     */
    getFileType: function(mimeType) {
        const typeMap = {
            'image/jpeg': 'ภาพ JPEG',
            'image/png': 'ภาพ PNG',
            'image/gif': 'ภาพ GIF',
            'image/webp': 'ภาพ WebP',
            'image/svg+xml': 'ภาพ SVG',
            'application/pdf': 'เอกสาร PDF',
            'text/plain': 'ไฟล์ข้อความ',
            'application/json': 'ไฟล์ JSON'
        };
        
        return typeMap[mimeType] || 'ไฟล์อื่นๆ';
    },

    // ==================== DATA EXPORT/IMPORT ====================

    /**
     * ดาวน์โหลดข้อมูลเป็นไฟล์ JSON
     * @param {Object} data - ข้อมูลที่จะส่งออก
     * @param {string} filename - ชื่อไฟล์
     */
    exportToJSON: function(data, filename = 'data-export.json') {
        try {
            // เพิ่ม metadata ในการส่งออก
            const exportData = {
                data: data,
                metadata: {
                    exportedAt: new Date().toISOString(),
                    version: '1.0.0',
                    source: 'BPT Amulets Gallery'
                }
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // เพิ่มลงใน DOM ชั่วคราว
            document.body.appendChild(link);
            link.click();
            
            // ทำความสะอาด
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('✅ Data exported successfully:', filename);
            
        } catch (error) {
            console.error('❌ Export failed:', error);
            throw new Error('การส่งออกข้อมูลล้มเหลว: ' + error.message);
        }
    },

    /**
     * อ่านไฟล์ JSON
     * @param {File} file - ไฟล์ที่จะอ่าน
     * @returns {Promise} Promise ที่ resolve กับข้อมูล
     */
    readJSONFile: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('ไฟล์ JSON ไม่ถูกต้อง: ' + error.message));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
            };
            
            reader.readAsText(file);
        });
    },

    /**
     * ส่งออกข้อมูลเป็น CSV
     * @param {Array} data - ข้อมูลที่จะส่งออก
     * @param {Array} columns - คอลัมน์ที่จะรวม
     * @param {string} filename - ชื่อไฟล์
     */
    exportToCSV: function(data, columns = [], filename = 'data-export.csv') {
        try {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('ไม่มีข้อมูลที่จะส่งออก');
            }
            
            // ถ้าไม่ได้ระบุ columns ให้ใช้ keys จาก object แรก
            const headers = columns.length > 0 ? columns : Object.keys(data[0]);
            
            // สร้าง header row
            let csvContent = headers.join(',') + '\n';
            
            // สร้าง data rows
            data.forEach(item => {
                const row = headers.map(header => {
                    let value = item[header];
                    
                    // จัดการกับค่าพิเศษ
                    if (value === null || value === undefined) {
                        value = '';
                    } else if (typeof value === 'string' && value.includes(',')) {
                        value = `"${value}"`; // escape commas
                    } else if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    
                    return value;
                });
                
                csvContent += row.join(',') + '\n';
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('CSV export failed:', error);
            throw error;
        }
    },

    // ==================== DOM MANIPULATION ====================

    /**
     * สร้าง DOM element ใหม่
     * @param {string} tag - tag name
     * @param {string} className - class name
     * @param {string} innerHTML - inner HTML
     * @returns {HTMLElement} element ที่สร้าง
     */
    createElement: function(tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        
        if (className) {
            element.className = className;
        }
        
        if (innerHTML) {
            element.innerHTML = innerHTML;
        }
        
        return element;
    },

    /**
     * ลบ element ทั้งหมดจาก container
     * @param {HTMLElement} container - container element
     */
    clearContainer: function(container) {
        if (container && container instanceof HTMLElement) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
    },

    /**
     * แสดง loading spinner
     * @param {string} message - ข้อความ loading
     * @returns {HTMLElement} loading element
     */
    showLoading: function(message = 'กำลังโหลด...') {
        // ลบ loading ที่มีอยู่ก่อนหน้า
        this.hideLoading();
        
        const loading = this.createElement('div', 'loading-overlay');
        loading.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        `;
        
        // เพิ่ม styles ถ้ายังไม่มี
        if (!document.querySelector('#loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    color: white;
                    font-family: 'Kanit', sans-serif;
                }
                .loading-spinner {
                    text-align: center;
                    background: rgba(40, 40, 40, 0.9);
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                }
                .loading-spinner i {
                    font-size: 2rem;
                    margin-bottom: 1rem;
                    display: block;
                    color: #00cc88;
                }
                .loading-spinner p {
                    margin: 0;
                    font-size: 1.1rem;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loading);
        return loading;
    },

    /**
     * ซ่อน loading spinner
     */
    hideLoading: function() {
        const existingLoading = document.querySelector('.loading-overlay');
        if (existingLoading) {
            existingLoading.remove();
        }
    },

    /**
     * แสดง notification
     * @param {string} message - ข้อความ
     * @param {string} type - ประเภท (success, error, warning, info)
     * @param {number} duration - ระยะเวลาแสดง (มิลลิวินาที)
     */
    showNotification: function(message, type = 'info', duration = 5000) {
        // ลบ notification เดิม
        this.hideNotification();
        
        const notification = this.createElement('div', `notification notification-${type}`);
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="utils.hideNotification()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // เพิ่ม styles ถ้ายังไม่มี
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #333;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    z-index: 10000;
                    animation: slideInRight 0.3s ease-out;
                    max-width: 400px;
                }
                .notification-success {
                    background: #00cc88;
                    color: #000;
                }
                .notification-error {
                    background: #ff4444;
                }
                .notification-warning {
                    background: #ffaa00;
                    color: #000;
                }
                .notification-info {
                    background: #0099ff;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // อัตโนมัติซ่อนหลังจาก duration
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification();
            }, duration);
        }
    },

    /**
     * รับ icon สำหรับ notification type
     * @param {string} type - ประเภท notification
     * @returns {string} class name ของ icon
     */
    getNotificationIcon: function(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    },

    /**
     * ซ่อน notification
     */
    hideNotification: function() {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
    },

    // ==================== VALIDATION ====================

    /**
     * ตรวจสอบอีเมล
     * @param {string} email - อีเมลที่จะตรวจสอบ
     * @returns {boolean} true ถ้าอีเมลถูกต้อง
     */
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * ตรวจสอบหมายเลขโทรศัพท์ไทย
     * @param {string} phone - หมายเลขโทรศัพท์
     * @returns {boolean} true ถ้าหมายเลขโทรศัพท์ถูกต้อง
     */
    isValidThaiPhone: function(phone) {
        const phoneRegex = /^(0[0-9]{1,2}[-\s]?[0-9]{3,4}[-\s]?[0-9]{4}|\\+66[0-9]{9})$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    /**
     * ตรวจสอบว่าเป็นตัวเลข
     * @param {string} str - สตริงที่จะตรวจสอบ
     * @returns {boolean} true ถ้าเป็นตัวเลข
     */
    isNumeric: function(str) {
        if (typeof str !== 'string') return false;
        return !isNaN(str) && !isNaN(parseFloat(str));
    },

    // ==================== ARRAY & OBJECT ====================

    /**
     * ลบ duplicate จาก array
     * @param {Array} array - array ต้นฉบับ
     * @returns {Array} array ที่ไม่มี duplicate
     */
    removeDuplicates: function(array) {
        return [...new Set(array)];
    },

    /**
     * group array ของ objects โดย key
     * @param {Array} array - array ของ objects
     * @param {string} key - key ที่ใช้ group
     * @returns {Object} object ที่ group แล้ว
     */
    groupBy: function(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },

    /**
     * เรียงลำดับ array ของ objects
     * @param {Array} array - array ที่จะเรียงลำดับ
     * @param {string} key - key ที่ใช้เรียงลำดับ
     * @param {boolean} ascending - เรียงจากน้อยไปหามากหรือไม่
     * @returns {Array} array ที่เรียงลำดับแล้ว
     */
    sortBy: function(array, key, ascending = true) {
        return array.sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            // แปลงเป็น string ถ้าจำเป็นสำหรับการเปรียบเทียบ
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });
    },

    /**
     * แปลง object เป็น query string
     * @param {Object} params - object ของ parameters
     * @returns {string} query string
     */
    objectToQueryString: function(params) {
        return Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    },

    // ==================== STORAGE ====================

    /**
     * บันทึกข้อมูลลง localStorage พร้อม expiration
     * @param {string} key - key
     * @param {any} data - ข้อมูล
     * @param {number} expirationMinutes - ระยะเวลา expiration (นาที)
     */
    setWithExpiration: function(key, data, expirationMinutes = 60) {
        try {
            const item = {
                data: data,
                expiration: Date.now() + (expirationMinutes * 60 * 1000)
            };
            localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
            console.error('LocalStorage set error:', error);
        }
    },

    /**
     * อ่านข้อมูลจาก localStorage พร้อมตรวจสอบ expiration
     * @param {string} key - key
     * @returns {any} ข้อมูลหรือ null ถ้า expired
     */
    getWithExpiration: function(key) {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiration) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.data;
        } catch (error) {
            console.error('LocalStorage get error:', error);
            return null;
        }
    },

    // ==================== PERFORMANCE ====================

    /**
     * วัดเวลาการทำงานของฟังก์ชัน
     * @param {Function} fn - ฟังก์ชันที่จะวัด
     * @param {string} label - label สำหรับ console
     * @returns {any} ผลลัพธ์จากฟังก์ชัน
     */
    measurePerformance: function(fn, label = 'Function') {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`⏱️ ${label} took ${(end - start).toFixed(2)}ms`);
        return result;
    },

    /**
     * debounce function
     * @param {Function} func - ฟังก์ชันที่จะ debounce
     * @param {number} wait - เวลารอ (มิลลิวินาที)
     * @returns {Function} ฟังก์ชันที่ถูก debounce แล้ว
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * throttle function
     * @param {Function} func - ฟังก์ชันที่จะ throttle
     * @param {number} limit - ระยะห่าง (มิลลิวินาที)
     * @returns {Function} ฟังก์ชันที่ถูก throttle แล้ว
     */
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ==================== MISC ====================

    /**
     * สุ่มตัวเลขระหว่าง min และ max
     * @param {number} min - ค่าต่ำสุด
     * @param {number} max - ค่าสูงสุด
     * @returns {number} ตัวเลขสุ่ม
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * สุ่มเลือกรายการจาก array
     * @param {Array} array - array ต้นฉบับ
     * @returns {any} รายการที่สุ่มได้
     */
    randomItem: function(array) {
        if (!Array.isArray(array) || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * ตรวจสอบว่าอยู่ใน mobile device หรือไม่
     * @returns {boolean} true ถ้าเป็น mobile device
     */
    isMobileDevice: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * ตรวจสอบว่าอยู่ใน touch device หรือไม่
     * @returns {boolean} true ถ้าเป็น touch device
     */
    isTouchDevice: function() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * คัดลอกข้อความไปยัง clipboard
     * @param {string} text - ข้อความที่จะคัดลอก
     * @returns {Promise} Promise ที่ resolve เมื่อคัดลอกสำเร็จ
     */
    copyToClipboard: function(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // Fallback สำหรับ browser ที่ไม่ support clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (error) {
                    reject(error);
                }
                
                textArea.remove();
            }
        });
    }
};

// ทำให้สามารถเรียกใช้จากภายนอกได้
window.utils = utils;

// Export สำหรับการใช้ใน module system (ถ้ามี)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
}
