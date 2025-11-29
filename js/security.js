// Security System
class SecuritySystem {
    constructor() {
        this.logs = [];
        this.rateLimiters = new Map();
        this.encryptionKey = null;
        this.securityStatus = 'SECURE';
        this.csrfToken = this.generateCSRFToken();
        this.adminPassword = 'BPT741258963'; // รหัสผ่านแอดมิน
        this.isAdmin = false;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 3;
        this.lockoutTime = 5 * 60 * 1000; // 5 นาที
        this.lockoutUntil = 0;
        this.sessionDuration = 8 * 60 * 60 * 1000; // 8 ชั่วโมง
    }

    // 🔐 ระบบล็อกอินแอดมิน
    async adminLogin(password) {
        // ตรวจสอบการล็อกเอ้าท์
        if (this.isLockedOut()) {
            const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 1000 / 60);
            throw new Error(`ระบบถูกระงับชั่วคราว กรุณารอ ${remainingTime} นาที`);
        }

        // ตรวจสอบรหัสผ่าน
        if (password === this.adminPassword) {
            this.isAdmin = true;
            this.loginAttempts = 0;
            this.lockoutUntil = 0;
            
            // สร้าง session token
            const sessionToken = this.generateSessionToken();
            sessionStorage.setItem('adminSession', sessionToken);
            sessionStorage.setItem('adminLoginTime', Date.now().toString());
            
            this.logSecurityEvent('HIGH', 'Admin login successful');
            return true;
        } else {
            this.loginAttempts++;
            
            // ตรวจสอบจำนวนครั้งที่ล็อกอินผิด
            if (this.loginAttempts >= this.maxLoginAttempts) {
                this.lockoutUntil = Date.now() + this.lockoutTime;
                this.logSecurityEvent('HIGH', 'Admin account locked due to failed attempts', {
                    attempts: this.loginAttempts,
                    lockoutUntil: new Date(this.lockoutUntil).toISOString()
                });
                throw new Error('ล็อกอินผิดเกินจำนวนครั้งที่กำหนด ระบบถูกระงับชั่วคราว 5 นาที');
            }
            
            const remainingAttempts = this.maxLoginAttempts - this.loginAttempts;
            this.logSecurityEvent('HIGH', 'Admin login failed', {
                attempts: this.loginAttempts,
                remainingAttempts: remainingAttempts
            });
            throw new Error(`รหัสผ่านไม่ถูกต้อง (เหลือโอกาสลองอีก ${remainingAttempts} ครั้ง)`);
        }
    }

    // 🔓 ตรวจสอบสถานะแอดมิน
    checkAdminStatus() {
        // ตรวจสอบ session
        const sessionToken = sessionStorage.getItem('adminSession');
        const loginTime = sessionStorage.getItem('adminLoginTime');
        
        if (!sessionToken || !loginTime) {
            this.isAdmin = false;
            return false;
        }

        // ตรวจสอบเวลา session
        const sessionAge = Date.now() - parseInt(loginTime);
        
        if (sessionAge > this.sessionDuration) {
            this.logSecurityEvent('MEDIUM', 'Admin session expired');
            this.logoutAdmin();
            return false;
        }

        // ตรวจสอบ session token
        if (this.validateSessionToken(sessionToken)) {
            this.isAdmin = true;
            
            // อัพเดทเวลา login เพื่อขยาย session
            sessionStorage.setItem('adminLoginTime', Date.now().toString());
            
            return true;
        }
        
        this.isAdmin = false;
        return false;
    }

    // 🚪 ออกจากระบบ
    logoutAdmin() {
        this.isAdmin = false;
        this.loginAttempts = 0;
        sessionStorage.removeItem('adminSession');
        sessionStorage.removeItem('adminLoginTime');
        this.logSecurityEvent('LOW', 'Admin logged out');
    }

    // 🔒 ตรวจสอบการล็อกเอ้าท์
    isLockedOut() {
        return Date.now() < this.lockoutUntil;
    }

    // 🎫 สร้าง session token
    generateSessionToken() {
        const tokenData = {
            userId: 'admin',
            timestamp: Date.now(),
            random: Math.random().toString(36).substr(2, 9),
            userAgent: navigator.userAgent,
            ip: this.getClientIP()
        };
        
        // เข้ารหัส token ด้วย base64
        const token = btoa(JSON.stringify(tokenData));
        return token;
    }

    // ✅ ตรวจสอบ session token
    validateSessionToken(token) {
        try {
            const tokenData = JSON.parse(atob(token));
            
            // ตรวจสอบโครงสร้าง token
            if (!tokenData.userId || !tokenData.timestamp || !tokenData.random) {
                this.logSecurityEvent('HIGH', 'Invalid session token structure');
                return false;
            }
            
            // ตรวจสอบว่า token ยังไม่หมดอายุ
            const tokenAge = Date.now() - tokenData.timestamp;
            if (tokenAge > this.sessionDuration) {
                this.logSecurityEvent('MEDIUM', 'Session token expired');
                return false;
            }
            
            // ตรวจสอบ user agent (ป้องกัน session hijacking)
            if (tokenData.userAgent !== navigator.userAgent) {
                this.logSecurityEvent('HIGH', 'Session token user agent mismatch');
                return false;
            }
            
            return true;
            
        } catch (error) {
            this.logSecurityEvent('HIGH', 'Session token validation failed', { error: error.message });
            return false;
        }
    }

    // 🛡️ ตรวจสอบสิทธิ์แอดมิน
    requireAdmin() {
        if (!this.checkAdminStatus()) {
            this.logSecurityEvent('HIGH', 'Admin permission required but not granted');
            throw new Error('ต้องการสิทธิ์ผู้ดูแลระบบ');
        }
        return true;
    }

    // 🔐 ระบบบันทึกความปลอดภัย
    logSecurityEvent(level, message, details = {}) {
        const logEntry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            details: details,
            ip: this.getClientIP(),
            userAgent: navigator.userAgent,
            adminStatus: this.isAdmin
        };
        
        this.logs.unshift(logEntry);
        
        // จำกัดจำนวน log
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(0, 100);
        }
        
        // อัปเดตสถานะความปลอดภัย
        this.updateSecurityStatus();
        
        // บันทึกลง localStorage
        this.saveSecurityLogs();
        
        // แสดงใน console สำหรับ debugging
        if (level === 'HIGH') {
            console.error(`🔴 [SECURITY ${level}] ${message}`, details);
        } else if (level === 'MEDIUM') {
            console.warn(`🟡 [SECURITY ${level}] ${message}`, details);
        } else {
            console.log(`🔵 [SECURITY ${level}] ${message}`, details);
        }
    }

    // 🆔 สร้าง ID สำหรับ log
    generateLogId() {
        return 'log_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }

    // 🛡️ Rate Limiting
    checkRateLimit(action, windowMs = 60000, maxAttempts = 10) {
        const key = `${action}_${this.getClientIP()}`;
        const now = Date.now();
        
        if (!this.rateLimiters.has(key)) {
            this.rateLimiters.set(key, []);
        }
        
        const attempts = this.rateLimiters.get(key);
        
        // ลบความพยายามที่เก่ากว่า windowMs
        const recentAttempts = attempts.filter(time => now - time < windowMs);
        
        if (recentAttempts.length >= maxAttempts) {
            this.logSecurityEvent('HIGH', 'Rate limit exceeded', { 
                action: action, 
                attempts: recentAttempts.length,
                ip: this.getClientIP()
            });
            return false;
        }
        
        recentAttempts.push(now);
        this.rateLimiters.set(key, recentAttempts);
        return true;
    }

    // 🔄 รีเซ็ต rate limit
    resetRateLimit(action) {
        const key = `${action}_${this.getClientIP()}`;
        this.rateLimiters.delete(key);
        this.logSecurityEvent('LOW', 'Rate limit reset', { action: action });
    }

    // 🔒 สร้าง CSRF Token
    generateCSRFToken() {
        const tokenData = {
            value: Math.random().toString(36).substr(2, 16),
            timestamp: Date.now(),
            ip: this.getClientIP()
        };
        
        const token = btoa(JSON.stringify(tokenData));
        sessionStorage.setItem('csrf_token', token);
        return token;
    }

    // ✅ ตรวจสอบ CSRF Token
    validateCSRFToken(token) {
        try {
            const storedToken = sessionStorage.getItem('csrf_token');
            if (!storedToken) {
                this.logSecurityEvent('HIGH', 'CSRF token not found');
                return false;
            }

            const tokenData = JSON.parse(atob(token));
            const storedData = JSON.parse(atob(storedToken));

            // ตรวจสอบค่า token
            const isValid = tokenData.value === storedData.value;
            
            if (!isValid) {
                this.logSecurityEvent('HIGH', 'CSRF token validation failed', {
                    provided: tokenData.value,
                    expected: storedData.value
                });
            }
            
            return isValid;
            
        } catch (error) {
            this.logSecurityEvent('HIGH', 'CSRF token validation error', { error: error.message });
            return false;
        }
    }

    // 🧹 ทำความสะอาด HTML (XSS Protection)
    sanitizeHTML(input) {
        if (typeof input !== 'string') return input;
        
        // สร้าง DOM element ชั่วคราว
        const div = document.createElement('div');
        div.textContent = input;
        
        // รับข้อความที่ปลอดภัย
        const safeText = div.innerHTML;
        
        // ลบ element ชั่วคราว
        div.remove();
        
        return safeText;
    }

    // 🔍 ตรวจสอบ URL (ป้องกัน malicious URLs)
    validateImageURL(url) {
        try {
            const urlObj = new URL(url);
            
            // อนุญาตเฉพาะ HTTPS
            const allowedProtocols = ['https:'];
            if (!allowedProtocols.includes(urlObj.protocol)) {
                this.logSecurityEvent('MEDIUM', 'Unsafe image protocol', { 
                    protocol: urlObj.protocol,
                    url: url 
                });
                return false;
            }
            
            // โดเมนที่อนุญาต
            const allowedDomains = [
                'images.unsplash.com',
                'images.pexels.com',
                'cdn.pixabay.com',
                'source.unsplash.com'
            ];
            
            if (!allowedDomains.includes(urlObj.hostname)) {
                this.logSecurityEvent('MEDIUM', 'Unsafe image domain', { 
                    domain: urlObj.hostname,
                    url: url 
                });
                return false;
            }
            
            // นามสกุลไฟล์ที่อนุญาต
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
            const pathname = urlObj.pathname.toLowerCase();
            const hasValidExtension = allowedExtensions.some(ext => pathname.endsWith(ext));
            
            if (!hasValidExtension) {
                this.logSecurityEvent('MEDIUM', 'Unsafe file extension', { 
                    pathname: pathname,
                    url: url 
                });
                return false;
            }
            
            // ตรวจสอบว่าเป็น URL ของรูปภาพจริงๆ
            return this.isValidImageURL(url);
            
        } catch (error) {
            this.logSecurityEvent('HIGH', 'Invalid URL format', { 
                url: url,
                error: error.message 
            });
            return false;
        }
    }

    // 🖼️ ตรวจสอบว่า URL เป็นรูปภาพจริงๆ
    async isValidImageURL(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.logSecurityEvent('LOW', 'Image URL validation successful', { url: url });
                resolve(true);
            };
            img.onerror = () => {
                this.logSecurityEvent('MEDIUM', 'Image URL validation failed', { url: url });
                resolve(false);
            };
            img.src = url;
            
            // Timeout after 5 seconds
            setTimeout(() => {
                this.logSecurityEvent('MEDIUM', 'Image URL validation timeout', { url: url });
                resolve(false);
            }, 5000);
        });
    }

    // 📏 ตรวจสอบไฟล์ (File Upload Security)
    validateFile(file) {
        if (!file) {
            throw new Error('ไม่มีไฟล์ที่อัปโหลด');
        }

        // ตรวจสอบประเภทไฟล์
        const allowedTypes = [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            this.logSecurityEvent('MEDIUM', 'Invalid file type', { 
                type: file.type,
                name: file.name 
            });
            throw new Error('ประเภทไฟล์ไม่ได้รับการอนุญาต');
        }
        
        // ตรวจสอบขนาดไฟล์ (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.logSecurityEvent('MEDIUM', 'File too large', { 
                size: file.size,
                name: file.name,
                maxSize: maxSize 
            });
            throw new Error('ขนาดไฟล์ต้องไม่เกิน 10MB');
        }
        
        // ตรวจสอบชื่อไฟล์
        if (!this.isSafeFilename(file.name)) {
            this.logSecurityEvent('MEDIUM', 'Unsafe filename', { 
                filename: file.name 
            });
            throw new Error('ชื่อไฟล์ไม่ปลอดภัย');
        }
        
        this.logSecurityEvent('LOW', 'File validation successful', { 
            name: file.name,
            type: file.type,
            size: file.size 
        });
        
        return true;
    }

    // 📛 ตรวจสอบชื่อไฟล์ที่ปลอดภัย
    isSafeFilename(filename) {
        // อนุญาตเฉพาะตัวอักษร, ตัวเลข, ขีดกลาง, ขีดล่าง, และจุด
        const safePattern = /^[a-zA-Z0-9_\-.ก-๙ ]+$/;
        
        // ไม่อนุญาต path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return false;
        }
        
        // ไม่อนุญาตชื่อไฟล์ระบบ
        const systemFiles = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'lpt1', 'lpt2'];
        const nameWithoutExt = filename.split('.')[0].toLowerCase();
        if (systemFiles.includes(nameWithoutExt)) {
            return false;
        }
        
        return safePattern.test(filename);
    }

    // 🔐 เข้ารหัสข้อมูล
    async encryptData(data) {
        if (!this.encryptionKey) {
            await this.generateEncryptionKey();
        }
        
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            // สร้าง IV (Initialization Vector)
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // เข้ารหัสข้อมูล
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                dataBuffer
            );
            
            this.logSecurityEvent('LOW', 'Data encrypted successfully');
            
            return {
                iv: Array.from(iv),
                data: Array.from(new Uint8Array(encrypted)),
                timestamp: Date.now()
            };
            
        } catch (error) {
            this.logSecurityEvent('HIGH', 'Data encryption failed', { error: error.message });
            throw new Error('การเข้ารหัสข้อมูลล้มเหลว');
        }
    }

    // 🔓 ถอดรหัสข้อมูล
    async decryptData(encryptedData) {
        try {
            if (!this.encryptionKey) {
                throw new Error('Encryption key not available');
            }
            
            const iv = new Uint8Array(encryptedData.iv);
            const data = new Uint8Array(encryptedData.data);
            
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                data
            );
            
            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decrypted);
            
            this.logSecurityEvent('LOW', 'Data decrypted successfully');
            
            return JSON.parse(decryptedText);
            
        } catch (error) {
            this.logSecurityEvent('HIGH', 'Data decryption failed', { error: error.message });
            throw new Error('การถอดรหัสข้อมูลล้มเหลว');
        }
    }

    // 🗝️ สร้าง encryption key
    async generateEncryptionKey() {
        try {
            this.encryptionKey = await crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true, // extractable
                ['encrypt', 'decrypt']
            );
            
            this.logSecurityEvent('LOW', 'Encryption key generated');
            
        } catch (error) {
            this.logSecurityEvent('HIGH', 'Encryption key generation failed', { error: error.message });
            throw new Error('ไม่สามารถสร้าง encryption key ได้');
        }
    }

    // 🚨 อัปเดตสถานะความปลอดภัย
    updateSecurityStatus() {
        const highRiskEvents = this.logs.filter(log => log.level === 'HIGH').length;
        const mediumRiskEvents = this.logs.filter(log => log.level === 'MEDIUM').length;
        
        let newStatus = 'SECURE';
        
        if (highRiskEvents > 5) {
            newStatus = 'CRITICAL';
        } else if (highRiskEvents > 2 || mediumRiskEvents > 10) {
            newStatus = 'WARNING';
        } else if (this.isLockedOut()) {
            newStatus = 'LOCKED';
        }
        
        // บันทึกการเปลี่ยนแปลงสถานะ
        if (newStatus !== this.securityStatus) {
            this.logSecurityEvent('MEDIUM', `Security status changed: ${this.securityStatus} -> ${newStatus}`);
            this.securityStatus = newStatus;
        }
        
        this.updateSecurityUI();
    }

    // 🎨 อัปเดต UI ความปลอดภัย
    updateSecurityUI() {
        const statusElement = document.getElementById('securityStatus');
        if (!statusElement) return;
        
        let icon, text, color;
        
        switch (this.securityStatus) {
            case 'CRITICAL':
                icon = 'fa-exclamation-triangle';
                text = 'ความเสี่ยงสูง!';
                color = 'rgba(255, 100, 100, 0.9)';
                break;
            case 'WARNING':
                icon = 'fa-exclamation-circle';
                text = 'คำเตือนความปลอดภัย';
                color = 'rgba(255, 170, 0, 0.9)';
                break;
            case 'LOCKED':
                icon = 'fa-lock';
                text = 'ระบบถูกระงับ';
                color = 'rgba(255, 100, 100, 0.9)';
                break;
            default:
                icon = 'fa-shield-alt';
                text = 'ระบบปลอดภัย';
                color = 'rgba(0, 204, 136, 0.9)';
        }
        
        statusElement.innerHTML = `<i class="fas ${icon}"></i> <span>${text}</span>`;
        statusElement.style.background = color;
        
        if (this.securityStatus === 'CRITICAL' || this.securityStatus === 'WARNING') {
            statusElement.classList.add('alert');
        } else {
            statusElement.classList.remove('alert');
        }
    }

    // 💾 บันทึก security logs
    saveSecurityLogs() {
        try {
            const logsToSave = this.logs.slice(0, 50); // จำกัดจำนวน log ที่บันทึก
            localStorage.setItem('bptSecurityLogs', JSON.stringify(logsToSave));
        } catch (error) {
            console.error('Failed to save security logs:', error);
        }
    }

    // 📥 โหลด security logs
    loadSecurityLogs() {
        try {
            const savedLogs = localStorage.getItem('bptSecurityLogs');
            if (savedLogs) {
                this.logs = JSON.parse(savedLogs);
                this.updateSecurityStatus();
                this.logSecurityEvent('LOW', 'Security logs loaded from storage');
            }
        } catch (error) {
            console.error('Failed to load security logs:', error);
            this.logSecurityEvent('HIGH', 'Failed to load security logs', { error: error.message });
        }
    }

    // 🧹 ล้าง security logs
    clearSecurityLogs() {
        this.logs = [];
        localStorage.removeItem('bptSecurityLogs');
        this.logSecurityEvent('LOW', 'Security logs cleared');
        this.updateSecurityStatus();
    }

    // 📊 รับสถิติความปลอดภัย
    getSecurityStats() {
        const totalLogs = this.logs.length;
        const highRiskLogs = this.logs.filter(log => log.level === 'HIGH').length;
        const mediumRiskLogs = this.logs.filter(log => log.level === 'MEDIUM').length;
        const lowRiskLogs = this.logs.filter(log => this.level === 'LOW').length;
        
        const today = new Date().toDateString();
        const todayLogs = this.logs.filter(log => new Date(log.timestamp).toDateString() === today);
        
        return {
            total: totalLogs,
            high: highRiskLogs,
            medium: mediumRiskLogs,
            low: lowRiskLogs,
            today: todayLogs.length,
            status: this.securityStatus,
            adminLoggedIn: this.isAdmin,
            lockoutTime: this.lockoutUntil > Date.now() ? Math.ceil((this.lockoutUntil - Date.now()) / 1000 / 60) : 0
        };
    }

    // 🌐 รับ client IP (จำลอง)
    getClientIP() {
        // ใน production ควรได้จาก server-side
        // นี่เป็นเพียงการจำลองสำหรับ demonstration
        return '127.0.0.1';
    }

    // 🔄 ตรวจสอบความสมบูรณ์ของข้อมูล
    validateDataIntegrity(data) {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data structure');
            }
            
            // ตรวจสอบโครงสร้างพื้นฐาน
            const requiredKeys = ['categories', 'albums', 'history', 'metadata'];
            for (const key of requiredKeys) {
                if (!(key in data)) {
                    throw new Error(`Missing required key: ${key}`);
                }
            }
            
            // ตรวจสอบ metadata
            if (!data.metadata || typeof data.metadata !== 'object') {
                throw new Error('Invalid metadata');
            }
            
            this.logSecurityEvent('LOW', 'Data integrity validation passed');
            return true;
            
        } catch (error) {
            this.logSecurityEvent('HIGH', 'Data integrity validation failed', { error: error.message });
            return false;
        }
    }

    // 🛡️ ตรวจสอบ input parameters
    validateInput(input, type = 'string', options = {}) {
        if (input === null || input === undefined) {
            throw new Error('Input is null or undefined');
        }
        
        switch (type) {
            case 'string':
                if (typeof input !== 'string') {
                    throw new Error('Input must be a string');
                }
                if (options.maxLength && input.length > options.maxLength) {
                    throw new Error(`Input too long (max: ${options.maxLength})`);
                }
                if (options.minLength && input.length < options.minLength) {
                    throw new Error(`Input too short (min: ${options.minLength})`);
                }
                if (options.pattern && !options.pattern.test(input)) {
                    throw new Error('Input pattern validation failed');
                }
                break;
                
            case 'number':
                if (typeof input !== 'number' || isNaN(input)) {
                    throw new Error('Input must be a valid number');
                }
                if (options.min !== undefined && input < options.min) {
                    throw new Error(`Input too small (min: ${options.min})`);
                }
                if (options.max !== undefined && input > options.max) {
                    throw new Error(`Input too large (max: ${options.max})`);
                }
                break;
                
            case 'array':
                if (!Array.isArray(input)) {
                    throw new Error('Input must be an array');
                }
                if (options.maxLength && input.length > options.maxLength) {
                    throw new Error(`Array too long (max: ${options.maxLength})`);
                }
                break;
        }
        
        return true;
    }

    // 🔍 ตรวจสอบ environment
    checkEnvironment() {
        const issues = [];
        
        // ตรวจสอบ HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            issues.push('ไม่ใช้ HTTPS');
        }
        
        // ตรวจสอบ localStorage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (error) {
            issues.push('localStorage ไม่สามารถใช้งานได้');
        }
        
        // ตรวจสอบ sessionStorage
        try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
        } catch (error) {
            issues.push('sessionStorage ไม่สามารถใช้งานได้');
        }
        
        // ตรวจสอบ crypto API
        if (!window.crypto || !window.crypto.subtle) {
            issues.push('Web Crypto API ไม่สามารถใช้งานได้');
        }
        
        if (issues.length > 0) {
            this.logSecurityEvent('MEDIUM', 'Environment issues detected', { issues: issues });
            return false;
        }
        
        this.logSecurityEvent('LOW', 'Environment check passed');
        return true;
    }

    // เริ่มต้นระบบ
    async initialize() {
        try {
            // ตรวจสอบ environment
            this.checkEnvironment();
            
            // สร้าง encryption key
            await this.generateEncryptionKey();
            
            // โหลด security logs
            this.loadSecurityLogs();
            
            // ตรวจสอบ session ที่มีอยู่
            this.checkAdminStatus();
            
            this.logSecurityEvent('LOW', 'Security system initialized successfully');
            
        } catch (error) {
            this.logSecurityEvent('HIGH', 'Security system initialization failed', { error: error.message });
            throw error;
        }
    }
}

// สร้าง instance security system
const securitySystem = new SecuritySystem();

// ทำให้สามารถเรียกใช้จากภายนอกได้
window.securitySystem = securitySystem;
