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

        // ตรวจสอบเวลา session (8 ชั่วโมง)
        const sessionDuration = Date.now() - parseInt(loginTime);
        const maxSessionDuration = 8 * 60 * 60 * 1000; // 8 ชั่วโมง
        
        if (sessionDuration > maxSessionDuration) {
            this.logoutAdmin();
            return false;
        }

        // ตรวจสอบ session token
        if (this.validateSessionToken(sessionToken)) {
            this.isAdmin = true;
            return true;
        }
        
        this.isAdmin = false;
        return false;
    }

    // 🚪 ออกจากระบบ
    logoutAdmin() {
        this.isAdmin = false;
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
            random: Math.random().toString(36).substr(2, 9)
        };
        
        const token = btoa(JSON.stringify(tokenData));
        return token;
    }

    // ✅ ตรวจสอบ session token
    validateSessionToken(token) {
        try {
            const tokenData = JSON.parse(atob(token));
            // ตรวจสอบว่า token ยังไม่หมดอายุ (ภายใน 1 นาที)
            const tokenAge = Date.now() - tokenData.timestamp;
            return tokenAge < 60000; // 1 นาที
        } catch (error) {
            return false;
        }
    }

    // 🛡️ ตรวจสอบสิทธิ์แอดมิน
    requireAdmin() {
        if (!this.checkAdminStatus()) {
            throw new Error('ต้องการสิทธิ์ผู้ดูแลระบบ');
        }
        return true;
    }

    // 🔐 ระบบบันทึกความปลอดภัย
    logSecurityEvent(level, message, details = {}) {
        const logEntry = {
            id: utils.generateId(),
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            details: details,
            ip: this.getClientIP(),
            userAgent: navigator.userAgent
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
        
        console.log(`[SECURITY ${level}] ${message}`, details);
    }

    // 🛡️ Rate Limiting
    checkRateLimit(action, windowMs = 60000, maxAttempts = 10) {
        const key = action;
        const now = Date.now();
        
        if (!this.rateLimiters.has(key)) {
            this.rateLimiters.set(key, []);
        }
        
        const attempts = this.rateLimiters.get(key);
        const recentAttempts = attempts.filter(time => now - time < windowMs);
        
        if (recentAttempts.length >= maxAttempts) {
            this.logSecurityEvent('HIGH', 'Rate limit exceeded', { action, attempts: recentAttempts.length });
            return false;
        }
        
        recentAttempts.push(now);
        this.rateLimiters.set(key, recentAttempts);
        return true;
    }

    // 🔒 สร้าง CSRF Token
    generateCSRFToken() {
        const token = crypto.randomUUID();
        sessionStorage.setItem('csrf_token', token);
        return token;
    }

    validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('csrf_token');
        const isValid = token === storedToken;
        
        if (!isValid) {
            this.logSecurityEvent('HIGH', 'CSRF token validation failed');
        }
        
        return isValid;
    }

    // 🧹 ทำความสะอาด HTML
    sanitizeHTML(input) {
        if (typeof input !== 'string') return input;
        
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // 🔍 ตรวจสอบ URL
    validateImageURL(url) {
        try {
            const urlObj = new URL(url);
            const allowedDomains = [
                'images.unsplash.com',
                'images.pexels.com',
                'trusted-cdn.com'
            ];
            
            const allowedProtocols = ['https:'];
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            
            // ตรวจสอบ domain
            if (!allowedDomains.includes(urlObj.hostname)) {
                this.logSecurityEvent('MEDIUM', 'Unsafe image domain', { domain: urlObj.hostname });
                return false;
            }
            
            // ตรวจสอบ protocol
            if (!allowedProtocols.includes(urlObj.protocol)) {
                this.logSecurityEvent('MEDIUM', 'Unsafe image protocol', { protocol: urlObj.protocol });
                return false;
            }
            
            // ตรวจสอบนามสกุลไฟล์
            const pathname = urlObj.pathname.toLowerCase();
            if (!allowedExtensions.some(ext => pathname.endsWith(ext))) {
                this.logSecurityEvent('MEDIUM', 'Unsafe file extension', { pathname });
                return false;
            }
            
            return true;
        } catch {
            this.logSecurityEvent('HIGH', 'Invalid URL format', { url });
            return false;
        }
    }

    // 📏 ตรวจสอบไฟล์
    validateFile(file) {
        const allowedTypes = [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp'
        ];
        
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            this.logSecurityEvent('MEDIUM', 'Invalid file type', { type: file.type });
            throw new Error('ประเภทไฟล์ไม่ได้รับการอนุญาต');
        }
        
        if (file.size > maxSize) {
            this.logSecurityEvent('MEDIUM', 'File too large', { size: file.size });
            throw new Error('ขนาดไฟล์ต้องไม่เกิน 10MB');
        }
        
        return true;
    }

    // 🚨 อัปเดตสถานะความปลอดภัย
    updateSecurityStatus() {
        const highRiskEvents = this.logs.filter(log => log.level === 'HIGH').length;
        const mediumRiskEvents = this.logs.filter(log => log.level === 'MEDIUM').length;
        
        if (highRiskEvents > 5) {
            this.securityStatus = 'CRITICAL';
        } else if (highRiskEvents > 2 || mediumRiskEvents > 10) {
            this.securityStatus = 'WARNING';
        } else {
            this.securityStatus = 'SECURE';
        }
        
        this.updateSecurityUI();
    }

    // 🎨 อัปเดต UI ความปลอดภัย
    updateSecurityUI() {
        const statusElement = document.getElementById('securityStatus');
        if (!statusElement) return;
        
        switch (this.securityStatus) {
            case 'CRITICAL':
                statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>ความเสี่ยงสูง!</span>';
                statusElement.className = 'security-status alert';
                break;
            case 'WARNING':
                statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>คำเตือนความปลอดภัย</span>';
                statusElement.className = 'security-status alert';
                break;
            default:
                statusElement.innerHTML = '<i class="fas fa-shield-alt"></i> <span>ระบบปลอดภัย</span>';
                statusElement.className = 'security-status';
        }
    }

    // 💾 บันทึก security logs
    saveSecurityLogs() {
        try {
            localStorage.setItem('bptSecurityLogs', JSON.stringify(this.logs));
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
            }
        } catch (error) {
            console.error('Failed to load security logs:', error);
        }
    }

    // 🌐 รับ client IP (จำลอง)
    getClientIP() {
        return '127.0.0.1';
    }

    // เริ่มต้นระบบ
    async initialize() {
        await this.generateEncryptionKey();
        this.loadSecurityLogs();
        this.logSecurityEvent('LOW', 'Security system initialized');
    }

    // สร้าง encryption key
    async generateEncryptionKey() {
        this.encryptionKey = await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }
}

// สร้าง instance security system
const securitySystem = new SecuritySystem();
