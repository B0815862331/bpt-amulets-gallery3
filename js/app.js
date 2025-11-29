// Main Application
const app = {
    // ตัวแปร global
    data: {
        categories: {},
        albums: {},
        history: [],
        metadata: {}
    },
    
    currentTab: 'gallery',
    currentImages: [],
    currentImageIndex: 0,
    currentZoom: 1,
    currentAlbumName: '',
    selectedFiles: [],
    selectedGalleryPhoto: null,
    isMuted: false,
    speechSynthesis: window.speechSynthesis,

    // DOM Elements
    elements: {},

    // เริ่มต้นแอปพลิเคชัน
    async initialize() {
        try {
            console.log('🚀 Starting application initialization...');
            
            // เริ่มต้นระบบความปลอดภัย
            await securitySystem.initialize();
            
            // ตรวจสอบสถานะแอดมิน
            securitySystem.checkAdminStatus();
            
            // โหลด DOM elements
            this.initializeElements();
            
            // สร้าง modals
            this.createModals();
            
            // โหลดข้อมูล
            await this.loadData();
            
            // เรนเดอร์ UI
            this.render();
            
            // ตั้งค่า event listeners
            this.setupEventListeners();
            
            // อัพเดท UI สำหรับแอดมิน
            this.updateUIForAdmin();
            
            // เล่นเสียงต้อนรับ
            setTimeout(() => {
                this.playWelcomeMessage();
            }, 1000);
            
            console.log('✅ Application initialized successfully');
            securitySystem.logSecurityEvent('LOW', 'Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            securitySystem.logSecurityEvent('HIGH', 'Application initialization failed', { error: error.message });
        }
    },

    // โหลด DOM elements
    initializeElements() {
        console.log('🔧 Initializing DOM elements...');
        this.elements = {
            gallery: document.getElementById('gallery'),
            searchBox: document.getElementById('searchBox'),
            categorySelect: document.getElementById('categorySelect'),
            modalsContainer: document.getElementById('modals-container'),
            volumeBtn: document.getElementById('volumeBtn'),
            tabGallery: document.getElementById('tabGallery'),
            tabAlbums: document.getElementById('tabAlbums'),
            tabHistory: document.getElementById('tabHistory'),
            tabSecurity: document.getElementById('tabSecurity')
        };
        console.log('✅ DOM elements initialized');
    },

    // สร้าง modals ทั้งหมด
    createModals() {
        console.log('🔧 Creating modals...');
        const modalsHTML = `
            <!-- Admin Login Modal -->
            <div id="adminLoginModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-lock"></i> ล็อกอินผู้ดูแลระบบ</h3>
                        <button class="modal-close" onclick="app.closeAdminLoginModal()">&times;</button>
                    </div>
                    <div class="form-group">
                        <label for="adminPassword">รหัสผ่านผู้ดูแลระบบ</label>
                        <input type="password" id="adminPassword" placeholder="กรอกรหัสผ่าน" style="width: 100%;">
                        <p style="font-size: 0.8rem; color: #888; margin-top: 5px;">
                            <i class="fas fa-info-circle"></i> เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่ม/ลบรูปภาพ
                        </p>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="secondary" onclick="app.closeAdminLoginModal()">ยกเลิก</button>
                        <button type="button" onclick="app.handleAdminLogin()">ล็อกอิน</button>
                    </div>
                    <div id="loginMessage" style="margin-top: 15px; text-align: center;"></div>
                </div>
            </div>

            <!-- Security Dashboard Modal -->
            <div id="securityModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>แดชบอร์ดความปลอดภัย</h3>
                        <button class="modal-close" onclick="app.closeSecurityModal()">&times;</button>
                    </div>
                    <div id="securityContent">
                        <div class="security-status-card">
                            <h4><i class="fas fa-shield-alt"></i> สถานะระบบความปลอดภัย</h4>
                            <div id="securityStatusDetails"></div>
                        </div>
                        <div class="security-logs" id="securityLogs">
                            <h4><i class="fas fa-clipboard-list"></i> บันทึกความปลอดภัย</h4>
                            <div id="securityLogsList"></div>
                        </div>
                        <div class="security-actions">
                            <h4><i class="fas fa-cogs"></i> การดำเนินการ</h4>
                            <div class="form-actions">
                                <button onclick="app.clearSecurityLogs()" class="secondary">
                                    <i class="fas fa-trash"></i> ล้างบันทึก
                                </button>
                                <button onclick="app.runSecurityScan()">
                                    <i class="fas fa-search"></i> สแกนระบบ
                                </button>
                                <button onclick="app.exportSecurityData()">
                                    <i class="fas fa-download"></i> ส่งออกข้อมูล
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Album View Modal -->
            <div id="albumModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalAlbumTitle">อัลบั้ม</h3>
                        <button class="modal-close" onclick="app.closeAlbumModal()">&times;</button>
                    </div>
                    <div id="albumModalContent"></div>
                    <div class="form-actions">
                        <button onclick="app.showAddPhotosModal()" class="secondary">
                            <i class="fas fa-plus"></i> เพิ่มรูปภาพ
                        </button>
                        <button onclick="app.deleteCurrentAlbum()" style="background: #ff4444;">
                            <i class="fas fa-trash"></i> ลบอัลบั้ม
                        </button>
                    </div>
                </div>
            </div>

            <!-- Image View Modal -->
            <div id="imageModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalImageTitle">รูปภาพ</h3>
                        <button class="modal-close" onclick="app.closeImageModal()">&times;</button>
                    </div>
                    <div id="imageModalContent">
                        <div class="drag-info" id="dragInfo">ลากเมาส์เพื่อขยับรูปภาพ</div>
                    </div>
                </div>
            </div>

            <!-- Create Album Modal -->
            <div id="createAlbumModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>สร้างอัลบั้มใหม่</h3>
                        <button class="modal-close" onclick="app.closeCreateAlbumModal()">&times;</button>
                    </div>
                    <form id="createAlbumForm">
                        <div class="form-group">
                            <label for="albumName">ชื่ออัลบั้ม</label>
                            <input type="text" id="albumName" required placeholder="กรอกชื่ออัลบั้ม">
                        </div>
                        <div class="form-group">
                            <label for="albumDescription">คำอธิบาย (ไม่บังคับ)</label>
                            <textarea id="albumDescription" placeholder="คำอธิบายเกี่ยวกับอัลบั้มนี้"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="secondary" onclick="app.closeCreateAlbumModal()">ยกเลิก</button>
                            <button type="submit">สร้างอัลบั้ม</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Add Photos to Album Modal -->
            <div id="addPhotosModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="addPhotosTitle">เพิ่มรูปภาพในอัลบั้ม</h3>
                        <button class="modal-close" onclick="app.closeAddPhotosModal()">&times;</button>
                    </div>
                    <div class="form-group">
                        <label>อัปโหลดรูปภาพ</label>
                        <div class="file-upload" onclick="document.getElementById('photoUpload').click()">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่</p>
                            <p style="font-size: 0.9rem; color: #888;">รองรับไฟล์ JPG, PNG, GIF</p>
                        </div>
                        <input type="file" id="photoUpload" multiple accept="image/*" style="display: none;" onchange="app.handleFileSelect(this.files)">
                    </div>
                    
                    <div class="url-upload-section">
                        <label>หรือเพิ่มจาก URL</label>
                        <div class="url-input-group">
                            <input type="text" id="albumPhotoURL" placeholder="วาง URL รูปภาพที่นี่ (เช่น https://example.com/image.jpg)">
                            <button type="button" onclick="app.loadAlbumPhotoFromURL()">เพิ่มจาก URL</button>
                        </div>
                    </div>
                    
                    <div class="uploaded-files" id="uploadedFiles"></div>
                    <div class="form-actions">
                        <button type="button" class="secondary" onclick="app.closeAddPhotosModal()">ยกเลิก</button>
                        <button type="button" onclick="app.savePhotosToAlbum()">บันทึกรูปภาพ</button>
                    </div>
                </div>
            </div>

            <!-- Add Gallery Photo Modal -->
            <div id="addGalleryPhotoModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>เพิ่มรูปภาพในแกลเลอรี</h3>
                        <button class="modal-close" onclick="app.closeAddGalleryPhotoModal()">&times;</button>
                    </div>
                    <form id="addGalleryPhotoForm">
                        <div class="form-group">
                            <label for="galleryPhotoName">ชื่อรูปภาพ</label>
                            <input type="text" id="galleryPhotoName" required placeholder="กรอกชื่อรูปภาพ">
                        </div>
                        <div class="form-group">
                            <label for="galleryPhotoCategory">หมวดหมู่</label>
                            <select id="galleryPhotoCategory" required>
                                <option value="">เลือกหมวดหมู่</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>อัปโหลดรูปภาพ</label>
                            <div class="file-upload" onclick="document.getElementById('galleryPhotoUpload').click()">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่</p>
                                <p style="font-size: 0.9rem; color: #888;">รองรับไฟล์ JPG, PNG, GIF</p>
                            </div>
                            <input type="file" id="galleryPhotoUpload" accept="image/*" style="display: none;" onchange="app.handleGalleryPhotoSelect(this.files)">
                        </div>
                        
                        <div class="url-upload-section">
                            <label>หรือเพิ่มจาก URL</label>
                            <div class="url-input-group">
                                <input type="text" id="galleryPhotoURL" placeholder="วาง URL รูปภาพที่นี่ (เช่น https://example.com/image.jpg)">
                                <button type="button" onclick="app.loadGalleryPhotoFromURL()">เพิ่มจาก URL</button>
                            </div>
                        </div>
                        
                        <div id="galleryPhotoPreview" style="text-align: center; margin-top: 1rem;"></div>
                    </form>
                    <div class="form-actions">
                        <button type="button" class="secondary" onclick="app.closeAddGalleryPhotoModal()">ยกเลิก</button>
                        <button type="button" onclick="app.saveGalleryPhoto()">บันทึกรูปภาพ</button>
                    </div>
                </div>
            </div>

            <!-- History Modal -->
            <div id="historyModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>ประวัติการใช้งาน</h3>
                        <button class="modal-close" onclick="app.closeHistoryModal()">&times;</button>
                    </div>
                    <div id="historyContent"></div>
                    <div class="form-actions">
                        <button onclick="app.clearHistory()" style="background: #ff4444;">
                            <i class="fas fa-trash"></i> ล้างประวัติ
                        </button>
                    </div>
                </div>
            </div>

            <!-- Fullscreen Mode -->
            <div id="fullscreenMode" class="fullscreen-mode">
                <button class="fullscreen-close" onclick="app.exitFullscreen()">&times;</button>
                <div class="fullscreen-counter" id="fullscreenCounter">1/1</div>
                <div class="fullscreen-nav">
                    <button class="nav-btn prev-btn" onclick="app.fullscreenPrevImage()">&#10094;</button>
                    <button class="nav-btn next-btn" onclick="app.fullscreenNextImage()">&#10095;</button>
                </div>
                <img id="fullscreenImage" class="fullscreen-image" src="" alt="">
                <div class="fullscreen-controls">
                    <button class="zoom-btn" onclick="app.fullscreenZoomOut()">−</button>
                    <div class="zoom-level" id="fullscreenZoomLevel">100%</div>
                    <button class="zoom-btn" onclick="app.fullscreenZoomIn()">+</button>
                    <button class="zoom-btn" onclick="app.fullscreenResetZoom()"><i class="fas fa-sync-alt"></i></button>
                    <button class="zoom-btn" onclick="app.toggleFullscreenInfo()"><i class="fas fa-info"></i></button>
                </div>
                <div class="drag-info" id="fullscreenDragInfo">ลากเมาส์เพื่อขยับรูปภาพ</div>
            </div>
        `;

        this.elements.modalsContainer.innerHTML = modalsHTML;
        console.log('✅ Modals created successfully');
    },

    // ==================== ADMIN FUNCTIONS ====================

    // 🔐 แสดง modal ล็อกอิน
    showAdminLoginModal() {
        console.log('🔐 Opening admin login modal...');
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.value = '';
        }
        
        const messageDiv = document.getElementById('loginMessage');
        if (messageDiv) {
            messageDiv.innerHTML = '';
            messageDiv.style.color = '';
        }
        
        this.showModal('adminLoginModal');
        securitySystem.logSecurityEvent('LOW', 'Admin login modal opened');
    },

    // 🔓 จัดการการล็อกอิน
    async handleAdminLogin() {
        const passwordInput = document.getElementById('adminPassword');
        const messageDiv = document.getElementById('loginMessage');
        
        if (!passwordInput || !messageDiv) return;
        
        const password = passwordInput.value.trim();
        
        if (!password) {
            messageDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> กรุณากรอกรหัสผ่าน';
            messageDiv.style.color = '#ff5555';
            return;
        }
        
        try {
            // แสดง loading
            messageDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
            messageDiv.style.color = '#00cc88';
            
            // ล็อกอิน
            await securitySystem.adminLogin(password);
            
            // ล็อกอินสำเร็จ
            messageDiv.innerHTML = '<i class="fas fa-check-circle"></i> ล็อกอินสำเร็จ!';
            messageDiv.style.color = '#00cc88';
            
            // ปิด modal หลังจาก 1 วินาที
            setTimeout(() => {
                this.closeAdminLoginModal();
                this.updateUIForAdmin();
                this.showAdminWelcome();
            }, 1000);
            
        } catch (error) {
            messageDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${error.message}`;
            messageDiv.style.color = '#ff5555';
            
            // เคลียร์ช่องรหัสผ่าน
            passwordInput.value = '';
            passwordInput.focus();
            
            securitySystem.logSecurityEvent('HIGH', 'Admin login failed in UI', { error: error.message });
        }
    },

    // 🚪 ปิด modal ล็อกอิน
    closeAdminLoginModal() {
        this.closeModal('adminLoginModal');
    },

    // 👑 อัพเดท UI สำหรับแอดมิน
    updateUIForAdmin() {
        // แสดงสถานะแอดมินใน security status
        const securityStatus = document.getElementById('securityStatus');
        if (securityStatus) {
            if (securitySystem.isAdmin) {
                securityStatus.innerHTML = '<i class="fas fa-crown"></i> <span>ผู้ดูแลระบบ</span>';
                securityStatus.style.background = 'rgba(255, 193, 7, 0.9)';
            } else {
                securityStatus.innerHTML = '<i class="fas fa-shield-alt"></i> <span>ระบบปลอดภัย</span>';
                securityStatus.style.background = 'rgba(0, 204, 136, 0.9)';
            }
        }
        
        // อัพเดทปุ่มต่างๆ
        this.updateAdminButtons();
    },

    // 🔄 อัพเดทปุ่มสำหรับแอดมิน
    updateAdminButtons() {
        const addPhotoBtn = document.querySelector('.add-photo-btn');
        const addAlbumBtn = document.querySelector('.add-album-btn');
        const adminBtn = document.querySelector('.admin-btn');
        
        if (securitySystem.isAdmin) {
            // แสดงปุ่มปกติสำหรับแอดมิน
            if (addPhotoBtn) {
                addPhotoBtn.innerHTML = '<i class="fas fa-plus"></i> เพิ่มรูป (แอดมิน)';
                addPhotoBtn.style.background = '#ffc107';
                addPhotoBtn.style.color = '#000';
            }
            if (addAlbumBtn) {
                addAlbumBtn.innerHTML = '<i class="fas fa-plus"></i> สร้างอัลบั้ม (แอดมิน)';
                addAlbumBtn.style.background = '#ffc107';
                addAlbumBtn.style.color = '#000';
            }
            if (adminBtn) {
                adminBtn.innerHTML = '<i class="fas fa-user-shield"></i> ออกจากระบบ';
                adminBtn.style.background = '#dc3545';
                adminBtn.style.color = 'white';
            }
        } else {
            // แสดงปุ่มสำหรับผู้ใช้ทั่วไป
            if (addPhotoBtn) {
                addPhotoBtn.innerHTML = '<i class="fas fa-plus"></i> เพิ่มรูป';
                addPhotoBtn.style.background = '#00cc88';
                addPhotoBtn.style.color = '#000';
            }
            if (addAlbumBtn) {
                addAlbumBtn.innerHTML = '<i class="fas fa-plus"></i> สร้างอัลบั้ม';
                addAlbumBtn.style.background = '#00cc88';
                addAlbumBtn.style.color = '#000';
            }
            if (adminBtn) {
                adminBtn.innerHTML = '<i class="fas fa-user-shield"></i> ผู้ดูแลระบบ';
                adminBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                adminBtn.style.color = 'white';
            }
        }
    },

    // 🎉 แสดงข้อความต้อนรับแอดมิน
    showAdminWelcome() {
        if (!securitySystem.isAdmin) return;
        
        // สร้าง notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 193, 7, 0.9);
            color: #000;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-crown"></i>
            <span>ยินดีต้อนรับผู้ดูแลระบบ!</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #000; cursor: pointer; margin-left: 10px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // อ่านข้อความต้อนรับ
        if (!this.isMuted) {
            this.speakText('ยินดีต้อนรับผู้ดูแลระบบ');
        }
        
        // ลบ notification หลังจาก 5 วินาที
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    // 🚪 ออกจากระบบแอดมิน
    adminLogout() {
        if (confirm('คุณต้องการออกจากระบบผู้ดูแลระบบใช่หรือไม่?')) {
            securitySystem.logoutAdmin();
            this.updateUIForAdmin();
            this.showLogoutMessage();
        }
    },

    // 📝 แสดงข้อความออกจากระบบ
    showLogoutMessage() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(108, 117, 125, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-sign-out-alt"></i>
            <span>ออกจากระบบผู้ดูแลระบบแล้ว</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // ลบ notification หลังจาก 3 วินาที
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    },

    // 🎛️ สลับเมนูแอดมิน
    toggleAdminMenu() {
        if (securitySystem.isAdmin) {
            // แสดงเมนูสำหรับแอดมินที่ล็อกอินแล้ว
            this.adminLogout();
        } else {
            // แสดง modal ล็อกอิน
            this.showAdminLoginModal();
        }
    },

    // ==================== GALLERY PHOTO FUNCTIONS ====================

    showAddGalleryPhotoModal() {
        console.log('📸 Opening add gallery photo modal...');
        
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มรูปภาพได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        const form = document.getElementById('addGalleryPhotoForm');
        if (form) form.reset();
        
        const preview = document.getElementById('galleryPhotoPreview');
        if (preview) preview.innerHTML = '';
        
        this.selectedGalleryPhoto = null;
        this.showModal('addGalleryPhotoModal');
        
        securitySystem.logSecurityEvent('LOW', 'Add gallery photo modal opened');
    },

    // ... (ฟังก์ชันอื่นๆ ที่มีอยู่ทั้งหมด)

    // ==================== SECURITY FUNCTIONS ====================

    showSecurityModal() {
        this.renderSecurityDashboard();
        this.showModal('securityModal');
        securitySystem.logSecurityEvent('LOW', 'User accessed security dashboard');
    },

    renderSecurityDashboard() {
        const statusDetails = document.getElementById('securityStatusDetails');
        const logsList = document.getElementById('securityLogsList');
        
        if (statusDetails) {
            statusDetails.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div style="background: rgba(0,204,136,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold;">${securitySystem.logs.length}</div>
                        <div>เหตุการณ์ทั้งหมด</div>
                    </div>
                    <div style="background: rgba(255,100,100,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold;">${securitySystem.logs.filter(log => log.level === 'HIGH').length}</div>
                        <div>ความเสี่ยงสูง</div>
                    </div>
                    <div style="background: rgba(255,170,0,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold;">${securitySystem.logs.filter(log => log.level === 'MEDIUM').length}</div>
                        <div>ความเสี่ยงปานกลาง</div>
                    </div>
                </div>
            `;
        }
        
        if (logsList) {
            logsList.innerHTML = '';
            if (securitySystem.logs.length === 0) {
                logsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">ไม่มีบันทึกความปลอดภัย</div>';
                return;
            }
            
            securitySystem.logs.slice(0, 10).forEach(log => {
                const logElement = document.createElement('div');
                logElement.className = 'security-log-item';
                
                const levelClass = `log-level-${log.level.toLowerCase()}`;
                const time = new Date(log.timestamp).toLocaleString('th-TH');
                
                logElement.innerHTML = `
                    <div>
                        <span class="${levelClass}">[${log.level}]</span>
                        <span>${log.message}</span>
                        <div style="font-size: 0.8rem; color: #888;">${time}</div>
                    </div>
                    <button onclick="app.viewSecurityLogDetails('${log.timestamp}')" class="album-action-btn">
                        <i class="fas fa-info-circle"></i>
                    </button>
                `;
                
                logsList.appendChild(logElement);
            });
        }
    },

    // ... (ฟังก์ชัน security อื่นๆ)

    // ระบบเสียง
    playWelcomeMessage() {
        if (this.isMuted) return;
        this.speakText("ยินดีต้อนรับสู่แหล่งแหล่งการเรียนรู้พระเครื่องแดนสยาม");
    },

    speakText(text) {
        if (this.isMuted || !this.speechSynthesis) return;
        
        // ยกเลิกการพูดที่กำลังดำเนินอยู่
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // รอให้ voices พร้อม
        if (speechSynthesis.getVoices().length > 0) {
            const voices = speechSynthesis.getVoices();
            const thaiVoice = voices.find(voice => voice.lang === 'th-TH' || voice.lang.startsWith('th-'));
            if (thaiVoice) {
                utterance.voice = thaiVoice;
            }
            this.speechSynthesis.speak(utterance);
        } else {
            // ถ้า voices ยังไม่พร้อม รอสักครู่
            setTimeout(() => {
                const voices = speechSynthesis.getVoices();
                const thaiVoice = voices.find(voice => voice.lang === 'th-TH' || voice.lang.startsWith('th-'));
                if (thaiVoice) {
                    utterance.voice = thaiVoice;
                }
                this.speechSynthesis.speak(utterance);
            }, 100);
        }
    },

    toggleVolume() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.elements.volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            this.elements.volumeBtn.classList.add('muted');
            this.speechSynthesis.cancel();
        } else {
            this.elements.volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            this.elements.volumeBtn.classList.remove('muted');
        }
        securitySystem.logSecurityEvent('LOW', `Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
    }
};

// ทำให้ฟังก์ชันสามารถเรียกใช้จาก HTML ได้
window.app = app;
