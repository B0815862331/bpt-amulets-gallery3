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
    fullscreenZoom: 1,
    showFullscreenInfo: true,
    currentAlbumName: '',
    selectedFiles: [],
    selectedGalleryPhoto: null,
    isMuted: false,
    speechSynthesis: window.speechSynthesis,

    // ตัวแปรสำหรับการลากเม้าขยับรูป
    currentTranslateX: 0,
    currentTranslateY: 0,
    fullscreenCurrentTranslateX: 0,
    fullscreenCurrentTranslateY: 0,

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

    // ตั้งค่า event listeners
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Tab events
        if (this.elements.tabGallery) {
            this.elements.tabGallery.addEventListener('click', () => {
                this.currentTab = 'gallery';
                this.updateActiveTab();
                this.render();
            });
        }

        if (this.elements.tabAlbums) {
            this.elements.tabAlbums.addEventListener('click', () => {
                this.currentTab = 'albums';
                this.updateActiveTab();
                this.render();
            });
        }

        if (this.elements.tabHistory) {
            this.elements.tabHistory.addEventListener('click', () => {
                this.currentTab = 'history';
                this.updateActiveTab();
                this.render();
            });
        }

        if (this.elements.tabSecurity) {
            this.elements.tabSecurity.addEventListener('click', () => {
                this.showSecurityModal();
            });
        }

        // Search and category events
        if (this.elements.searchBox) {
            this.elements.searchBox.addEventListener('input', () => {
                this.render();
            });
        }

        if (this.elements.categorySelect) {
            this.elements.categorySelect.addEventListener('change', () => {
                this.render();
            });
        }

        // Form events
        const createAlbumForm = document.getElementById('createAlbumForm');
        if (createAlbumForm) {
            createAlbumForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewAlbum(e);
            });
        }

        // Global click events for modals
        document.addEventListener('click', (event) => {
            const modals = ['albumModal', 'imageModal', 'createAlbumModal', 'addPhotosModal', 'addGalleryPhotoModal', 'historyModal', 'securityModal', 'adminLoginModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && event.target === modal) {
                    const closeMethod = `close${modalId.charAt(0).toUpperCase() + modalId.slice(1)}`;
                    if (this[closeMethod]) {
                        this[closeMethod]();
                    }
                }
            });
        });

        // Keyboard events
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Navigation in image viewer
            if (document.getElementById('imageModal').style.display === 'flex') {
                if (event.key === 'ArrowLeft') {
                    this.prevImage();
                } else if (event.key === 'ArrowRight') {
                    this.nextImage();
                }
            }
        });

        // Drag and drop for file uploads
        this.setupDragAndDrop();

        console.log('✅ Event listeners setup completed');
    },

    // ตั้งค่า drag and drop
    setupDragAndDrop() {
        const fileUploads = document.querySelectorAll('.file-upload');
        fileUploads.forEach(upload => {
            upload.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.borderColor = '#00cc88';
                this.style.background = 'rgba(0,204,136,0.1)';
            });

            upload.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.style.borderColor = '#555';
                this.style.background = 'transparent';
            });

            upload.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.borderColor = '#555';
                this.style.background = 'transparent';
                
                if (this.closest('#addPhotosModal')) {
                    app.handleFileSelect(e.dataTransfer.files);
                } else if (this.closest('#addGalleryPhotoModal')) {
                    app.handleGalleryPhotoSelect(e.dataTransfer.files);
                }
            });
        });
    },

    // อัพเดท tab ที่ active
    updateActiveTab() {
        const tabs = ['tabGallery', 'tabAlbums', 'tabHistory', 'tabSecurity'];
        tabs.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) {
                if (tabId === `tab${this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1)}`) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            }
        });
    },

    // โหลดข้อมูล
    async loadData() {
        try {
            console.log('📥 Loading data...');
            
            // พยายามโหลดจาก JSON ไฟล์ก่อน
            await this.loadFromJSON();
            
            // ถ้าไม่มีข้อมูล ให้ใช้ข้อมูลจาก localStorage
            if (Object.keys(this.data.categories).length === 0) {
                this.loadFromLocalStorage();
            }
            
            // ถ้ายังไม่มีข้อมูล ให้ใช้ข้อมูลเริ่มต้น
            if (Object.keys(this.data.categories).length === 0) {
                this.loadDefaultData();
            }
            
            console.log('✅ Data loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            this.loadFromLocalStorage();
        }
    },

    // โหลดจาก JSON ไฟล์
    async loadFromJSON() {
        try {
            const response = await fetch('data/amulets.json');
            if (response.ok) {
                const jsonData = await response.json();
                this.data = { ...this.data, ...jsonData };
                securitySystem.logSecurityEvent('LOW', 'Data loaded from JSON file');
                console.log('✅ Data loaded from JSON file');
            }
        } catch (error) {
            console.warn('⚠️ Cannot load from JSON file, using localStorage instead');
            throw error;
        }
    },

    // โหลดจาก localStorage
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('bptAmuletsData');
            if (savedData) {
                this.data = JSON.parse(savedData);
                securitySystem.logSecurityEvent('LOW', 'Data loaded from localStorage');
                console.log('✅ Data loaded from localStorage');
            }
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
            securitySystem.logSecurityEvent('HIGH', 'Failed to parse stored data', { error: error.message });
        }
    },

    // ข้อมูลเริ่มต้น
    loadDefaultData() {
        console.log('📝 Loading default data...');
        this.data = {
            categories: {
                "พระยอดนิยม": [
                    {
                        "id": "1",
                        "name": "พระบางลำพูน",
                        "imageUrl": "https://images.unsplash.com/photo-1586947201838-5d66c1b94a5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVkZGhhfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
                        "description": "พระบางลำพูน สร้างสมัยล้านนา",
                        "createdAt": new Date().toISOString(),
                        "createdBy": "ผู้ใช้"
                    }
                ]
            },
            albums: {},
            history: [
                {
                    "id": "hist1",
                    "type": "เริ่มต้นระบบ",
                    "details": "โหลดข้อมูลเริ่มต้นสำเร็จ",
                    "timestamp": new Date().toISOString()
                }
            ],
            metadata: {
                lastUpdated: new Date().toISOString(),
                totalPhotos: 1,
                totalAlbums: 0,
                version: '1.0.0'
            }
        };
        console.log('✅ Default data loaded');
    },

    // บันทึกข้อมูล
    saveData() {
        try {
            // อัปเดต metadata
            this.data.metadata.lastUpdated = new Date().toISOString();
            this.data.metadata.totalPhotos = this.getTotalPhotos();
            this.data.metadata.totalAlbums = Object.keys(this.data.albums).length;
            
            // บันทึกลง localStorage
            localStorage.setItem('bptAmuletsData', JSON.stringify(this.data));
            
            console.log('💾 Data saved successfully');
            
        } catch (error) {
            console.error('❌ Failed to save data:', error);
            securitySystem.logSecurityEvent('HIGH', 'Failed to save data', { error: error.message });
        }
    },

    // นับจำนวนรูปภาพทั้งหมด
    getTotalPhotos() {
        let total = 0;
        Object.values(this.data.categories).forEach(photos => {
            total += photos.length;
        });
        Object.values(this.data.albums).forEach(album => {
            total += album.photos ? album.photos.length : 0;
        });
        return total;
    },

    // เรนเดอร์ UI หลัก
    render() {
        console.log('🎨 Rendering UI...');
        this.loadCategories();
        
        switch (this.currentTab) {
            case 'gallery':
                this.renderGallery();
                break;
            case 'albums':
                this.renderAlbums();
                break;
            case 'history':
                this.renderHistory();
                break;
        }
        console.log('✅ UI rendered successfully');
    },

    // เรนเดอร์แกลเลอรี
    renderGallery() {
        if (!this.elements.gallery) return;
        
        this.elements.gallery.innerHTML = '';
        const search = this.elements.searchBox ? this.elements.searchBox.value.toLowerCase() : '';
        const selectedCategory = this.elements.categorySelect ? this.elements.categorySelect.value : '';
        const categories = selectedCategory ? [selectedCategory] : Object.keys(this.data.categories || {});
        
        let hasResults = false;
        
        categories.forEach(category => {
            (this.data.categories[category] || []).forEach((photo, index) => {
                if (search && !photo.name.toLowerCase().includes(search) && !category.toLowerCase().includes(search)) return;
                hasResults = true;
                
                const photoElement = this.createPhotoElement(photo, category, index);
                this.elements.gallery.appendChild(photoElement);
            });
        });
        
        if (!hasResults) {
            this.elements.gallery.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-image"></i>
                    <p>ไม่พบรูปภาพที่ตรงกับการค้นหา</p>
                    ${search ? `<p style="color: #888; margin-top: 10px;">คำค้นหา: "${search}"</p>` : ''}
                </div>
            `;
        }
    },

    // สร้าง element รูปภาพ
    createPhotoElement(photo, category, index) {
        const div = document.createElement('div');
        div.className = 'photo';
        
        // ใช้ regex เพื่อ escape single quotes ในชื่อรูปภาพ
        const safeName = photo.name.replace(/'/g, "\\'");
        
        div.innerHTML = `
            <div class="photo-actions">
                <button class="photo-action-btn" onclick="event.stopPropagation(); app.speakText('${safeName}')" title="อ่านชื่อรูปภาพ">
                    <i class="fas fa-volume-up"></i>
                </button>
                <button class="photo-action-btn delete" onclick="event.stopPropagation(); app.deleteGalleryPhoto('${category}', ${index})" title="ลบรูปภาพ">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <img src="${photo.imageUrl || photo.data}" alt="${photo.name}" loading="lazy">
            <div class="photo-name">${securitySystem.sanitizeHTML(photo.name)}</div>
        `;
        
        div.addEventListener('click', () => {
            const allPhotos = this.getAllPhotosForView();
            this.viewImage(photo.imageUrl || photo.data, photo.name, allPhotos);
        });
        
        return div;
    },

    // ดึงรูปภาพทั้งหมดสำหรับการดู
    getAllPhotosForView() {
        const allPhotos = [];
        Object.values(this.data.categories).forEach(photos => {
            photos.forEach(photo => {
                allPhotos.push(photo);
            });
        });
        return allPhotos;
    },

    // ดูรูปภาพ
    viewImage(src, title, images) {
        this.currentImages = images || [{imageUrl: src, name: title}];
        this.currentImageIndex = this.currentImages.findIndex(img => 
            (img.imageUrl || img.data) === src
        );
        if (this.currentImageIndex === -1) this.currentImageIndex = 0;
        
        this.updateImageDisplay();
        this.showModal('imageModal');
        this.resetZoom();
        this.resetImagePosition();
        
        if (!this.isMuted) {
            setTimeout(() => {
                this.speakText(`รูปภาพ ${title}`);
            }, 500);
        }
    },

    // อัพเดทการแสดงรูปภาพ
    updateImageDisplay() {
        const currentImage = this.currentImages[this.currentImageIndex];
        const modalImageTitle = document.getElementById('modalImageTitle');
        const imageModalContent = document.getElementById('imageModalContent');
        
        if (modalImageTitle) {
            modalImageTitle.textContent = currentImage.name;
        }
        
        if (imageModalContent) {
            const safeName = currentImage.name.replace(/'/g, "\\'");
            
            imageModalContent.innerHTML = `
                <button class="fullscreen-btn" onclick="app.enterFullscreen()" title="เต็มจอ">
                    <i class="fas fa-expand"></i>
                </button>
                <div class="image-nav">
                    <button class="nav-btn prev-btn" onclick="app.prevImage()">&#10094;</button>
                    <button class="nav-btn next-btn" onclick="app.nextImage()">&#10095;</button>
                </div>
                <div class="image-counter">${this.currentImageIndex + 1}/${this.currentImages.length}</div>
                <div class="zoom-controls">
                    <button class="zoom-btn" onclick="app.zoomOut()">−</button>
                    <div class="zoom-level">${Math.round(this.currentZoom * 100)}%</div>
                    <button class="zoom-btn" onclick="app.zoomIn()">+</button>
                    <button class="zoom-btn" onclick="app.resetZoom()"><i class="fas fa-sync-alt"></i></button>
                    <button class="zoom-btn" onclick="app.enterFullscreen()"><i class="fas fa-expand"></i></button>
                    <button class="zoom-btn" onclick="app.speakText('${safeName}')" title="อ่านชื่อรูปภาพ">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <img class="zoomable-image" 
                     src="${currentImage.imageUrl || currentImage.data}" 
                     alt="${currentImage.name}" 
                     style="transform: scale(${this.currentZoom}) translate(${this.currentTranslateX}px, ${this.currentTranslateY}px);"
                     onclick="app.toggleZoom()">
                <div class="drag-info">ลากเมาส์เพื่อขยับรูปภาพ</div>
            `;
            
            // ตั้งค่า drag สำหรับรูปภาพ
            const zoomableImage = imageModalContent.querySelector('.zoomable-image');
            if (zoomableImage) {
                this.setupImageDrag(zoomableImage, imageModalContent, false);
                zoomableImage.addEventListener('wheel', (e) => this.handleImageZoom(e));
            }
        }
    },

    // ตั้งค่าระบบลากเมาส์
    setupImageDrag(imageElement, container, isFullscreen = false) {
        let isDragging = false;
        let startX, startY;
        let translateX = isFullscreen ? this.fullscreenCurrentTranslateX : this.currentTranslateX;
        let translateY = isFullscreen ? this.fullscreenCurrentTranslateY : this.currentTranslateY;

        const startDrag = (e) => {
            e.preventDefault();
            isDragging = true;
            
            if (e.type === 'touchstart') {
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
            } else {
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
            }
            
            if (isFullscreen) {
                document.getElementById('fullscreenMode').classList.add('dragging');
                imageElement.classList.add('dragging');
            } else {
                container.classList.add('dragging');
                imageElement.classList.add('dragging');
            }
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            translateX = clientX - startX;
            translateY = clientY - startY;

            // จำกัดการขยับไม่ให้เกินขอบเขต
            const maxMove = isFullscreen ? 200 : 100;
            translateX = Math.max(Math.min(translateX, maxMove), -maxMove);
            translateY = Math.max(Math.min(translateY, maxMove), -maxMove);

            const zoom = isFullscreen ? this.fullscreenZoom : this.currentZoom;
            imageElement.style.transform = `scale(${zoom}) translate(${translateX}px, ${translateY}px)`;
        };

        const endDrag = () => {
            isDragging = false;
            
            if (isFullscreen) {
                document.getElementById('fullscreenMode').classList.remove('dragging');
                imageElement.classList.remove('dragging');
                this.fullscreenCurrentTranslateX = translateX;
                this.fullscreenCurrentTranslateY = translateY;
            } else {
                container.classList.remove('dragging');
                imageElement.classList.remove('dragging');
                this.currentTranslateX = translateX;
                this.currentTranslateY = translateY;
            }
        };

        // Event listeners
        imageElement.addEventListener('mousedown', startDrag);
        imageElement.addEventListener('touchstart', startDrag, { passive: false });
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    },

    // จัดการการซูมด้วยเมาส์
    handleImageZoom(e) {
        e.preventDefault();
        
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    },

    // โหลดหมวดหมู่
    loadCategories() {
        if (!this.elements.categorySelect) return;
        
        this.elements.categorySelect.innerHTML = '';
        const galleryCategorySelect = document.getElementById('galleryPhotoCategory');
        if (galleryCategorySelect) {
            galleryCategorySelect.innerHTML = '<option value="">เลือกหมวดหมู่</option>';
        }
        
        const categories = Object.keys(this.data.categories || {});
        
        if (categories.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = '-- ยังไม่มีหมวดหมู่ --';
            opt.disabled = true;
            opt.selected = true;
            this.elements.categorySelect.appendChild(opt);
        } else {
            const allOpt = document.createElement('option');
            allOpt.value = '';
            allOpt.textContent = 'ทั้งหมด';
            allOpt.selected = true;
            this.elements.categorySelect.appendChild(allOpt);
            
            categories.forEach(category => {
                const opt = document.createElement('option');
                opt.value = category;
                opt.textContent = category;
                this.elements.categorySelect.appendChild(opt);
                
                if (galleryCategorySelect) {
                    const galleryOpt = document.createElement('option');
                    galleryOpt.value = category;
                    galleryOpt.textContent = category;
                    galleryCategorySelect.appendChild(galleryOpt);
                }
            });
        }
    },

    // ==================== MODAL FUNCTIONS ====================

    // แสดง modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },

    // ปิด modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    },

    // ปิด modal ทั้งหมด
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    },

    // ฟังก์ชันปิด modal เฉพาะ
    closeSecurityModal() { this.closeModal('securityModal'); }
    closeAlbumModal() { this.closeModal('albumModal'); }
    closeImageModal() { this.closeModal('imageModal'); }
    closeCreateAlbumModal() { this.closeModal('createAlbumModal'); }
    closeAddPhotosModal() { this.closeModal('addPhotosModal'); }
    closeAddGalleryPhotoModal() { this.closeModal('addGalleryPhotoModal'); }
    closeHistoryModal() { this.closeModal('historyModal'); }
    closeAdminLoginModal() { this.closeModal('adminLoginModal'); }

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

    handleGalleryPhotoSelect(files) {
        if (files.length > 0) {
            const file = files[0];
            
            try {
                securitySystem.validateFile(file);
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.selectedGalleryPhoto = {
                        name: file.name,
                        data: e.target.result
                    };
                    
                    const preview = document.getElementById('galleryPhotoPreview');
                    if (preview) {
                        preview.innerHTML = `
                            <img src="${e.target.result}" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
                            <p style="margin-top: 10px; color: #ccc;">${securitySystem.sanitizeHTML(file.name)}</p>
                        `;
                    }
                    
                    securitySystem.logSecurityEvent('LOW', 'Gallery photo selected', { filename: file.name });
                };
                reader.readAsDataURL(file);
            } catch (error) {
                alert(error.message);
                securitySystem.logSecurityEvent('MEDIUM', 'Invalid file selected', { error: error.message });
            }
        }
    },

    loadGalleryPhotoFromURL() {
        if (!securitySystem.checkRateLimit('url_upload')) {
            alert('การดำเนินการนี้ถูกจำกัดจำนวนครั้ง กรุณารอสักครู่');
            return;
        }
        
        const urlInput = document.getElementById('galleryPhotoURL');
        const url = urlInput ? urlInput.value.trim() : '';
        
        if (!url) {
            alert('กรุณากรอก URL ของรูปภาพ');
            return;
        }
        
        if (!securitySystem.validateImageURL(url)) {
            alert('URL นี้ไม่ปลอดภัยหรือไม่ได้รับการอนุญาต');
            return;
        }
        
        const preview = document.getElementById('galleryPhotoPreview');
        if (preview) {
            preview.innerHTML = '<p style="color: #ccc;">กำลังโหลดรูปภาพ...</p>';
        }
        
        const img = new Image();
        img.onload = () => {
            this.selectedGalleryPhoto = {
                name: utils.getFilenameFromURL(url) || 'รูปภาพจาก URL',
                data: url
            };
            
            if (preview) {
                preview.innerHTML = `
                    <div class="url-preview">
                        <img src="${url}" alt="รูปภาพจาก URL">
                        <p>${this.selectedGalleryPhoto.name}</p>
                        <p style="color: #00cc88;">โหลดรูปภาพสำเร็จ!</p>
                    </div>
                `;
            }
            
            if (urlInput) urlInput.value = '';
            securitySystem.logSecurityEvent('LOW', 'Gallery photo loaded from URL', { url });
        };
        
        img.onerror = () => {
            if (preview) {
                preview.innerHTML = '<p style="color: #ff5555;">ไม่สามารถโหลดรูปภาพจาก URL นี้ได้</p>';
            }
            securitySystem.logSecurityEvent('MEDIUM', 'Failed to load image from URL', { url });
        };
        
        img.src = url;
    },

    saveGalleryPhoto() {
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มรูปภาพได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        if (!securitySystem.checkRateLimit('add_photo')) {
            alert('การดำเนินการนี้ถูกจำกัดจำนวนครั้ง กรุณารอสักครู่');
            return;
        }

        const photoNameInput = document.getElementById('galleryPhotoName');
        const categorySelect = document.getElementById('galleryPhotoCategory');
        
        const photoName = photoNameInput ? photoNameInput.value.trim() : '';
        const category = categorySelect ? categorySelect.value : '';
        
        if (!photoName) {
            alert('กรุณากรอกชื่อรูปภาพ');
            return;
        }
        
        if (!category) {
            alert('กรุณาเลือกหมวดหมู่');
            return;
        }
        
        if (!this.selectedGalleryPhoto) {
            alert('กรุณาเลือกรูปภาพ');
            return;
        }

        // สร้างหมวดหมู่ใหม่ถ้ายังไม่มี
        if (!this.data.categories[category]) {
            this.data.categories[category] = [];
            this.addHistory('สร้างหมวดหมู่', `สร้างหมวดหมู่ '${category}'`);
        }

        // เพิ่มรูปภาพในหมวดหมู่
        const newPhoto = {
            id: utils.generateId(),
            name: securitySystem.sanitizeHTML(photoName),
            imageUrl: this.selectedGalleryPhoto.data,
            description: '',
            createdAt: new Date().toISOString(),
            createdBy: 'ผู้ดูแลระบบ'
        };
        
        this.data.categories[category].push(newPhoto);
        this.saveData();
        
        this.addHistory('เพิ่มรูปภาพ', `เพิ่มรูปภาพ '${photoName}' ในหมวดหมู่ '${category}'`);
        
        this.closeAddGalleryPhotoModal();
        this.render();
        
        if (!this.isMuted) {
            setTimeout(() => {
                this.speakText(`เพิ่มรูปภาพ ${photoName} ในหมวดหมู่ ${category} เรียบร้อยแล้ว`);
            }, 500);
        }
        
        securitySystem.logSecurityEvent('LOW', 'Gallery photo saved by admin', { 
            name: photoName, 
            category: category 
        });

        alert('✅ บันทึกรูปภาพเรียบร้อยแล้ว!');
    },

    deleteGalleryPhoto(category, index) {
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบรูปภาพได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        const photo = this.data.categories[category][index];
        if (confirm(`คุณต้องการลบรูปภาพ "${photo.name}" ใช่หรือไม่?`)) {
            this.data.categories[category].splice(index, 1);
            
            // ลบหมวดหมู่ถ้าไม่มีรูปภาพแล้ว
            if (this.data.categories[category].length === 0) {
                delete this.data.categories[category];
            }
            
            this.saveData();
            this.addHistory('ลบรูปภาพ', `ลบรูปภาพ '${photo.name}' จากหมวดหมู่ '${category}'`);
            this.render();
            
            this.speakText(`ลบรูปภาพ ${photo.name} เรียบร้อยแล้ว`);
            
            securitySystem.logSecurityEvent('LOW', 'Gallery photo deleted by admin', {
                name: photo.name,
                category: category
            });
        }
    },

    // ==================== ALBUM FUNCTIONS ====================

    showCreateAlbumModal() {
        console.log('📁 Opening create album modal...');
        
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถสร้างอัลบั้มได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        const form = document.getElementById('createAlbumForm');
        if (form) form.reset();
        this.showModal('createAlbumModal');
        securitySystem.logSecurityEvent('LOW', 'Create album modal opened');
    },

    createNewAlbum(event) {
        event.preventDefault();
        
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถสร้างอัลบั้มได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        const albumNameInput = document.getElementById('albumName');
        const albumDescriptionInput = document.getElementById('albumDescription');
        
        const albumName = albumNameInput ? albumNameInput.value.trim() : '';
        const albumDescription = albumDescriptionInput ? albumDescriptionInput.value.trim() : '';

        if (!albumName) {
            alert('กรุณากรอกชื่ออัลบั้ม');
            return;
        }

        if (this.data.albums[albumName]) {
            alert('มีอัลบั้มชื่อนี้อยู่แล้ว');
            return;
        }

        this.data.albums[albumName] = {
            id: utils.generateId(),
            name: albumName,
            description: albumDescription,
            photos: [],
            coverImage: '',
            createdAt: new Date().toISOString(),
            createdBy: 'ผู้ดูแลระบบ'
        };

        this.saveData();
        this.addHistory('สร้างอัลบั้ม', `สร้างอัลบั้ม '${albumName}'`);
        
        this.closeCreateAlbumModal();
        this.render();
        
        this.speakText(`สร้างอัลบั้ม ${albumName} เรียบร้อยแล้ว`);
        alert('✅ สร้างอัลบั้มเรียบร้อยแล้ว!');
    },

    // ==================== HISTORY FUNCTIONS ====================

    renderHistory() {
        if (!this.elements.gallery) return;
        
        this.elements.gallery.innerHTML = '';
        
        if (this.data.history.length === 0) {
            this.elements.gallery.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>ยังไม่มีประวัติการใช้งาน</p>
                </div>
            `;
            return;
        }
        
        const historyContainer = document.createElement('div');
        historyContainer.style.width = '100%';
        
        this.data.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const time = new Date(item.timestamp).toLocaleString('th-TH');
            
            historyItem.innerHTML = `
                <div class="history-type">${item.type}</div>
                <div class="history-details">${item.details}</div>
                <div class="history-time">${time}</div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
        
        this.elements.gallery.appendChild(historyContainer);
    },

    showHistoryModal() {
        this.renderHistoryModal();
        this.showModal('historyModal');
    },

    renderHistoryModal() {
        const historyContent = document.getElementById('historyContent');
        if (!historyContent) return;
        
        historyContent.innerHTML = '';
        
        if (this.data.history.length === 0) {
            historyContent.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i> ยังไม่มีประวัติการใช้งาน</div>';
            return;
        }
        
        this.data.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const time = new Date(item.timestamp).toLocaleString('th-TH');
            
            historyItem.innerHTML = `
                <div class="history-type">${item.type}</div>
                <div class="history-details">${item.details}</div>
                <div class="history-time">${time}</div>
            `;
            
            historyContent.appendChild(historyItem);
        });
    },

    clearHistory() {
        if (confirm('คุณต้องการล้างประวัติการใช้งานทั้งหมดใช่หรือไม่?')) {
            this.data.history = [];
            this.saveData();
            this.renderHistory();
            this.speakText('ล้างประวัติการใช้งานเรียบร้อยแล้ว');
        }
    },

    // ==================== ALBUM VIEW FUNCTIONS ====================

    renderAlbums() {
        if (!this.elements.gallery) return;
        
        this.elements.gallery.innerHTML = '';
        const search = this.elements.searchBox ? this.elements.searchBox.value.toLowerCase() : '';
        const albums = Object.keys(this.data.albums || {});
        
        if (albums.length === 0) {
            this.elements.gallery.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder"></i>
                    <p>ยังไม่มีอัลบั้ม</p>
                    <p style="margin-top: 10px; font-size: 0.9rem; color: #888;">สร้างอัลบั้มแรกของคุณโดยคลิกปุ่ม "สร้างอัลบั้ม"</p>
                </div>
            `;
            return;
        }
        
        let hasResults = false;
        albums.forEach(name => {
            if (search && !name.toLowerCase().includes(search)) return;
            hasResults = true;
            
            const album = this.data.albums[name];
            const card = document.createElement('div');
            card.className = 'album-card';
            card.onclick = () => this.viewAlbumByName(name);
            
            const hasPhotos = album.photos && album.photos.length > 0;
            const cover = hasPhotos ? 
                (this.getPhotoById(album.photos[0])?.imageUrl || '') : 
                '';
            
            card.innerHTML = `
                <div class="album-cover" style="background-image:url('${cover}')">
                    ${!hasPhotos ? '<div class="empty-album-cover"><i class="far fa-folder-open"></i></div>' : ''}
                </div>
                <div class="album-info">
                    <div class="album-name">${name}</div>
                    <div class="album-count">${album.photos.length} รูป</div>
                    <div class="album-actions">
                        <button class="album-action-btn" onclick="event.stopPropagation(); app.editAlbum('${name}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="album-action-btn" onclick="event.stopPropagation(); app.deleteAlbum('${name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            this.elements.gallery.appendChild(card);
        });
        
        if (!hasResults) {
            this.elements.gallery.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder"></i>
                    <p>ไม่พบอัลบั้มที่ตรงกับการค้นหา</p>
                </div>
            `;
        }
    },

    getPhotoById(photoId) {
        // ฟังก์ชันช่วยในการหารูปภาพโดยใช้ ID
        for (const category in this.data.categories) {
            const photo = this.data.categories[category].find(p => p.id === photoId);
            if (photo) return photo;
        }
        return null;
    },

    viewAlbumByName(name) {
        this.currentAlbumName = name;
        const modalAlbumTitle = document.getElementById('modalAlbumTitle');
        const albumModalContent = document.getElementById('albumModalContent');
        
        if (modalAlbumTitle) {
            modalAlbumTitle.textContent = name;
        }
        
        if (albumModalContent) {
            albumModalContent.innerHTML = '';
            const album = this.data.albums[name];
            const photos = album.photos || [];
            
            if (photos.length === 0) {
                albumModalContent.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <i class="far fa-folder-open" style="font-size: 4rem; color: #666; margin-bottom: 1rem;"></i>
                        <p style="color: #ccc; font-size: 1.1rem;">อัลบั้มนี้ยังไม่มีรูปภาพ</p>
                        <p style="color: #888; margin-top: 0.5rem;">เพิ่มรูปภาพแรกของคุณในอัลบั้ม "${name}"</p>
                    </div>
                `;
            } else {
                // สร้าง grid สำหรับรูปภาพในอัลบั้ม
                const grid = document.createElement('div');
                grid.className = 'album-photo-grid';
                
                photos.forEach((photoId, index) => {
                    const photo = this.getPhotoById(photoId);
                    if (photo) {
                        const item = document.createElement('div');
                        item.className = 'album-photo-item';
                        item.innerHTML = `
                            <button class="delete-photo-btn" onclick="app.deletePhotoFromAlbum('${name}', ${index})">
                                <i class="fas fa-times"></i>
                            </button>
                            <img src="${photo.imageUrl || photo.data}" alt="${photo.name}" loading="lazy">
                            <div class="album-photo-name">${photo.name}</div>
                        `;
                        item.addEventListener('click', (e) => {
                            if (!e.target.classList.contains('delete-photo-btn')) {
                                this.viewImage(photo.imageUrl || photo.data, photo.name, photos.map(id => this.getPhotoById(id)).filter(p => p));
                            }
                        });
                        grid.appendChild(item);
                    }
                });
                
                albumModalContent.appendChild(grid);
            }
        }
        
        this.showModal('albumModal');
    },

    showAddPhotosModal() {
        if (!securitySystem.checkRateLimit('add_album_photos')) {
            alert('การดำเนินการนี้ถูกจำกัดจำนวนครั้ง กรุณารอสักครู่');
            return;
        }
        
        const addPhotosTitle = document.getElementById('addPhotosTitle');
        if (addPhotosTitle) {
            addPhotosTitle.textContent = `เพิ่มรูปภาพในอัลบั้ม "${this.currentAlbumName}"`;
        }
        
        const uploadedFiles = document.getElementById('uploadedFiles');
        if (uploadedFiles) {
            uploadedFiles.innerHTML = '';
        }
        
        this.selectedFiles = [];
        this.showModal('addPhotosModal');
        
        securitySystem.logSecurityEvent('LOW', 'Add photos to album modal opened', { album: this.currentAlbumName });
    },

    handleFileSelect(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                securitySystem.validateFile(file);
                
                const reader = new FileReader();
                reader.onload = (function(theFile) {
                    return function(e) {
                        app.selectedFiles.push({
                            name: theFile.name,
                            data: e.target.result
                        });
                        app.updateUploadedFilesList();
                        securitySystem.logSecurityEvent('LOW', 'File added to upload list', { filename: theFile.name });
                    };
                })(file);
                reader.readAsDataURL(file);
            } catch (error) {
                alert(`ไฟล์ ${file.name}: ${error.message}`);
                securitySystem.logSecurityEvent('MEDIUM', 'Invalid file in batch upload', { 
                    filename: file.name, 
                    error: error.message 
                });
            }
        }
    },

    updateUploadedFilesList() {
        const uploadedFiles = document.getElementById('uploadedFiles');
        if (!uploadedFiles) return;
        
        uploadedFiles.innerHTML = '';
        this.selectedFiles.forEach((file, index) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'uploaded-file';
            fileElement.innerHTML = `
                <span>${securitySystem.sanitizeHTML(file.name)}</span>
                <button onclick="app.removeSelectedFile(${index})" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            uploadedFiles.appendChild(fileElement);
        });
    },

    removeSelectedFile(index) {
        const removedFile = this.selectedFiles[index];
        this.selectedFiles.splice(index, 1);
        this.updateUploadedFilesList();
        securitySystem.logSecurityEvent('LOW', 'File removed from upload list', { filename: removedFile.name });
    },

    loadAlbumPhotoFromURL() {
        if (!securitySystem.checkRateLimit('url_upload')) {
            alert('การดำเนินการนี้ถูกจำกัดจำนวนครั้ง กรุณารอสักครู่');
            return;
        }
        
        const urlInput = document.getElementById('albumPhotoURL');
        const url = urlInput ? urlInput.value.trim() : '';
        
        if (!url) {
            alert('กรุณากรอก URL ของรูปภาพ');
            return;
        }
        
        if (!securitySystem.validateImageURL(url)) {
            alert('URL นี้ไม่ปลอดภัยหรือไม่ได้รับการอนุญาต');
            return;
        }
        
        // แสดงสถานะกำลังโหลด
        const uploadedFiles = document.getElementById('uploadedFiles');
        const loadingElement = document.createElement('div');
        loadingElement.className = 'uploaded-file';
        loadingElement.innerHTML = `<span>กำลังโหลดรูปภาพจาก URL...</span>`;
        uploadedFiles.appendChild(loadingElement);
        
        // สร้าง Image object เพื่อทดสอบโหลดรูปภาพ
        const img = new Image();
        img.onload = function() {
            // เมื่อโหลดสำเร็จ
            loadingElement.remove();
            
            const filename = utils.getFilenameFromURL(url) || 'รูปภาพจาก URL';
            app.selectedFiles.push({
                name: filename,
                data: url
            });
            
            app.updateUploadedFilesList();
            if (urlInput) urlInput.value = '';
            securitySystem.logSecurityEvent('LOW', 'Album photo loaded from URL', { url });
        };
        
        img.onerror = function() {
            // เมื่อโหลดไม่สำเร็จ
            loadingElement.innerHTML = `<span style="color: #ff5555;">ไม่สามารถโหลดรูปภาพจาก URL นี้ได้</span>`;
            setTimeout(() => {
                loadingElement.remove();
            }, 3000);
            securitySystem.logSecurityEvent('MEDIUM', 'Failed to load album image from URL', { url });
        };
        
        img.src = url;
    },

    savePhotosToAlbum() {
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มรูปภาพได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        if (!securitySystem.checkRateLimit('save_album_photos')) {
            alert('การดำเนินการนี้ถูกจำกัดจำนวนครั้ง กรุณารอสักครู่');
            return;
        }

        if (this.selectedFiles.length === 0) {
            alert('กรุณาเลือกรูปภาพก่อน');
            return;
        }

        this.selectedFiles.forEach(file => {
            const newPhoto = {
                id: utils.generateId(),
                name: securitySystem.sanitizeHTML(file.name),
                imageUrl: file.data,
                description: '',
                createdAt: new Date().toISOString(),
                createdBy: 'ผู้ดูแลระบบ'
            };
            
            // เพิ่มรูปภาพในหมวดหมู่ "อัลบั้ม" ก่อน
            if (!this.data.categories['อัลบั้ม']) {
                this.data.categories['อัลบั้ม'] = [];
            }
            this.data.categories['อัลบั้ม'].push(newPhoto);
            
            // เพิ่ม ID รูปภาพในอัลบั้ม
            this.data.albums[this.currentAlbumName].photos.push(newPhoto.id);
        });

        this.saveData();
        this.addHistory('เพิ่มรูปภาพ', `เพิ่มรูปภาพ ${this.selectedFiles.length} รูปในอัลบั้ม '${this.currentAlbumName}'`);
        
        this.closeAddPhotosModal();
        this.viewAlbumByName(this.currentAlbumName);
        
        if (!this.isMuted) {
            setTimeout(() => {
                this.speakText(`เพิ่มรูปภาพ ${this.selectedFiles.length} รูปในอัลบั้ม ${this.currentAlbumName} เรียบร้อยแล้ว`);
            }, 500);
        }
        
        securitySystem.logSecurityEvent('LOW', 'Photos saved to album', { 
            album: this.currentAlbumName, 
            count: this.selectedFiles.length 
        });
    },

    deletePhotoFromAlbum(albumName, photoIndex) {
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบรูปภาพได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        const album = this.data.albums[albumName];
        const photoId = album.photos[photoIndex];
        const photo = this.getPhotoById(photoId);
        
        if (photo && confirm(`คุณต้องการลบรูปภาพ "${photo.name}" ใช่หรือไม่?`)) {
            album.photos.splice(photoIndex, 1);
            this.saveData();
            this.addHistory('ลบรูปภาพ', `ลบรูปภาพ '${photo.name}' จากอัลบั้ม '${albumName}'`);
            this.viewAlbumByName(albumName);
            
            this.speakText(`ลบรูปภาพ ${photo.name} เรียบร้อยแล้ว`);
            
            securitySystem.logSecurityEvent('LOW', 'Photo deleted from album', {
                name: photo.name,
                album: albumName
            });
        }
    },

    deleteAlbum(albumName) {
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบอัลบั้มได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        if (confirm(`คุณต้องการลบอัลบั้ม "${albumName}" ใช่หรือไม่?`)) {
            delete this.data.albums[albumName];
            this.saveData();
            this.addHistory('ลบอัลบั้ม', `ลบอัลบั้ม '${albumName}'`);
            this.render();
            if (this.currentAlbumName === albumName) {
                this.closeAlbumModal();
            }
            this.speakText(`ลบอัลบั้ม ${albumName} เรียบร้อยแล้ว`);
        }
    },

    deleteCurrentAlbum() {
        this.deleteAlbum(this.currentAlbumName);
    },

    editAlbum(albumName) {
        // ตรวจสอบสิทธิ์แอดมิน
        try {
            securitySystem.requireAdmin();
        } catch (error) {
            alert('⚠️ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขอัลบั้มได้\n\nกรุณาล็อกอินเป็นผู้ดูแลระบบก่อน');
            this.showAdminLoginModal();
            return;
        }

        const newName = prompt('กรอกชื่ออัลบั้มใหม่:', albumName);
        if (newName && newName.trim() && newName !== albumName) {
            if (this.data.albums[newName]) {
                alert('มีอัลบั้มชื่อนี้อยู่แล้ว');
                return;
            }
            this.data.albums[newName] = this.data.albums[albumName];
            delete this.data.albums[albumName];
            this.saveData();
            this.addHistory('แก้ไขอัลบั้ม', `แก้ไขชื่ออัลบั้มจาก '${albumName}' เป็น '${newName}'`);
            this.render();
            if (this.currentAlbumName === albumName) {
                this.closeAlbumModal();
            }
            this.speakText(`แก้ไขชื่ออัลบั้มเป็น ${newName} เรียบร้อยแล้ว`);
        }
    },

    // ==================== IMAGE VIEWER FUNCTIONS ====================

    zoomIn() {
        if (this.currentZoom < 3) {
            this.currentZoom += 0.1;
            this.updateZoom();
        }
    },

    zoomOut() {
        if (this.currentZoom > 0.5) {
            this.currentZoom -= 0.1;
            this.updateZoom();
        }
    },

    resetZoom() {
        this.currentZoom = 1;
        this.updateZoom();
    },

    toggleZoom() {
        this.currentZoom = this.currentZoom === 1 ? 2 : 1;
        this.updateZoom();
    },

    updateZoom() {
        const zoomableImage = document.querySelector('.zoomable-image');
        const zoomLevel = document.querySelector('.zoom-level');
        if (zoomableImage) {
            zoomableImage.style.transform = `scale(${this.currentZoom}) translate(${this.currentTranslateX}px, ${this.currentTranslateY}px)`;
        }
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
        }
    },

    resetImagePosition() {
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;
        const zoomableImage = document.querySelector('.zoomable-image');
        if (zoomableImage) {
            zoomableImage.style.transform = `scale(${this.currentZoom}) translate(0px, 0px)`;
        }
    },

    prevImage() {
        if (this.currentImages.length > 1) {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.currentImages.length) % this.currentImages.length;
            this.updateImageDisplay();
            this.resetZoom();
            this.resetImagePosition();
        }
    },

    nextImage() {
        if (this.currentImages.length > 1) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.currentImages.length;
            this.updateImageDisplay();
            this.resetZoom();
            this.resetImagePosition();
        }
    },

    enterFullscreen() {
        const currentImage = this.currentImages[this.currentImageIndex];
        const fullscreenImage = document.getElementById('fullscreenImage');
        const fullscreenCounter = document.getElementById('fullscreenCounter');
        const fullscreenZoomLevel = document.getElementById('fullscreenZoomLevel');
        
        if (fullscreenImage) {
            fullscreenImage.src = currentImage.imageUrl || currentImage.data;
        }
        if (fullscreenCounter) {
            fullscreenCounter.textContent = `${this.currentImageIndex + 1}/${this.currentImages.length}`;
        }
        if (fullscreenZoomLevel) {
            fullscreenZoomLevel.textContent = `${Math.round(this.fullscreenZoom * 100)}%`;
        }
        
        this.showModal('fullscreenMode');
        
        this.fullscreenCurrentTranslateX = 0;
        this.fullscreenCurrentTranslateY = 0;
        if (fullscreenImage) {
            fullscreenImage.style.transform = `scale(${this.fullscreenZoom}) translate(0px, 0px)`;
            this.setupImageDrag(fullscreenImage, document.getElementById('fullscreenMode'), true);
        }
    },

    exitFullscreen() {
        this.closeModal('fullscreenMode');
    },

    fullscreenPrevImage() {
        this.prevImage();
        this.enterFullscreen();
    },

    fullscreenNextImage() {
        this.nextImage();
        this.enterFullscreen();
    },

    fullscreenZoomIn() {
        if (this.fullscreenZoom < 3) {
            this.fullscreenZoom += 0.1;
            this.updateFullscreenZoom();
        }
    },

    fullscreenZoomOut() {
        if (this.fullscreenZoom > 0.5) {
            this.fullscreenZoom -= 0.1;
            this.updateFullscreenZoom();
        }
    },

    fullscreenResetZoom() {
        this.fullscreenZoom = 1;
        this.updateFullscreenZoom();
        this.fullscreenCurrentTranslateX = 0;
        this.fullscreenCurrentTranslateY = 0;
        const fullscreenImage = document.getElementById('fullscreenImage');
        if (fullscreenImage) {
            fullscreenImage.style.transform = `scale(1) translate(0px, 0px)`;
        }
    },

    updateFullscreenZoom() {
        const fullscreenImage = document.getElementById('fullscreenImage');
        const fullscreenZoomLevel = document.getElementById('fullscreenZoomLevel');
        if (fullscreenImage) {
            fullscreenImage.style.transform = `scale(${this.fullscreenZoom}) translate(${this.fullscreenCurrentTranslateX}px, ${this.fullscreenCurrentTranslateY}px)`;
        }
        if (fullscreenZoomLevel) {
            fullscreenZoomLevel.textContent = `${Math.round(this.fullscreenZoom * 100)}%`;
        }
    },

    toggleFullscreenInfo() {
        this.showFullscreenInfo = !this.showFullscreenInfo;
        const elements = [
            document.getElementById('fullscreenCounter'),
            document.querySelector('.fullscreen-controls'),
            document.querySelector('.fullscreen-nav')
        ];
        
        elements.forEach(el => {
            if (el) {
                el.style.opacity = this.showFullscreenInfo ? '1' : '0';
            }
        });
    },

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

    viewSecurityLogDetails(timestamp) {
        const log = securitySystem.logs.find(l => l.timestamp === timestamp);
        if (log) {
            alert(`รายละเอียดเหตุการณ์ความปลอดภัย:\n\nระดับ: ${log.level}\nข้อความ: ${log.message}\nเวลา: ${new Date(log.timestamp).toLocaleString('th-TH')}\nรายละเอียด: ${JSON.stringify(log.details, null, 2)}`);
        }
    },

    clearSecurityLogs() {
        if (confirm('คุณต้องการล้างบันทึกความปลอดภัยทั้งหมดใช่หรือไม่?')) {
            securitySystem.logs = [];
            securitySystem.saveSecurityLogs();
            securitySystem.updateSecurityStatus();
            this.renderSecurityDashboard();
            securitySystem.logSecurityEvent('LOW', 'User cleared security logs');
        }
    },

    runSecurityScan() {
        securitySystem.logSecurityEvent('LOW', 'Security scan initiated');
        
        // จำลองการสแกน
        let issuesFound = 0;
        
        // ตรวจสอบข้อมูลใน localStorage
        try {
            JSON.parse(localStorage.getItem('bptAmuletsData') || '{}');
        } catch (e) {
            issuesFound++;
            securitySystem.logSecurityEvent('HIGH', 'Corrupted data detected in localStorage');
        }
        
        // ตรวจสอบภาพที่ไม่ปลอดภัย
        Object.values(this.data.categories).forEach(photos => {
            photos.forEach(photo => {
                if (!securitySystem.validateImageURL(photo.imageUrl || photo.data)) {
                    issuesFound++;
                }
            });
        });
        
        // แสดงผลการสแกน
        setTimeout(() => {
            if (issuesFound === 0) {
                alert('✅ การสแกนความปลอดภัยเสร็จสิ้น\nไม่พบปัญหาความปลอดภัย');
                securitySystem.logSecurityEvent('LOW', 'Security scan completed - No issues found');
            } else {
                alert(`⚠️ การสแกนความปลอดภัยเสร็จสิ้น\nพบปัญหาความปลอดภัย ${issuesFound} รายการ\nตรวจสอบบันทึกความปลอดภัยสำหรับรายละเอียด`);
            }
        }, 1000);
    },

    exportSecurityData() {
        const securityData = {
            logs: securitySystem.logs,
            scanTime: new Date().toISOString(),
            systemInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            }
        };
        
        utils.exportToJSON(securityData, `security-report-${new Date().toISOString().split('T')[0]}.json`);
        securitySystem.logSecurityEvent('LOW', 'Security data exported');
    },

    // ==================== UTILITY FUNCTIONS ====================

    addHistory(type, details) {
        const historyItem = {
            id: utils.generateId(),
            type: type,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.data.history.unshift(historyItem);
        
        // จำกัดจำนวนประวัติ
        if (this.data.history.length > 50) {
            this.data.history = this.data.history.slice(0, 50);
        }
        
        this.saveData();
        securitySystem.logSecurityEvent('LOW', `User action: ${type}`, { details });
    },

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
