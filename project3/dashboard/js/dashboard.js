// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    loadBlocks();
    setupEventListeners();
    setupModalEvents();
    startExpiryChecker();
});




// تحميل البلوكات من السيرفر
async function loadBlocks() {
    const blocksContainer = document.getElementById('blocks-container');
    
    // نجيب اليوزر الحالي
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '../index.html';
        return;
    }
    
    try {
        // جلب البلوكات من السيرفر
        const response = await fetch(`/.netlify/functions/blocks?email=${encodeURIComponent(currentUser.email)}`);
        const result = await response.json();
        
        if (result.success) {
            const userBlocks = result.blocks || [];
            
            if (userBlocks.length === 0) {
                blocksContainer.innerHTML = `
                    <div class="empty-state">
                        <h3>No blocks yet</h3>
                        <p>Click on "Create" to create your first block</p>
                    </div>
                `;
                return;
            }
            
            blocksContainer.innerHTML = '';
            userBlocks.forEach(block => {
                const blockElement = createBlockElement(block);
                blocksContainer.appendChild(blockElement);
            });
        } else {
            showToast('Error loading blocks');
        }
    } catch (error) {
        console.error('Error loading blocks:', error);
        showToast('Network error. Using local data.');
        
        // Fallback إلى localStorage إذا ال API فشل
        const users = JSON.parse(localStorage.getItem('users')) || {};
        const userBlocks = users[currentUser.email]?.blocks || [];
        
        if (userBlocks.length === 0) {
            blocksContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No blocks yet</h3>
                    <p>Click on "Create" to create your first block</p>
                </div>
            `;
            return;
        }
        
        blocksContainer.innerHTML = '';
        userBlocks.forEach(block => {
            const blockElement = createBlockElement(block);
            blocksContainer.appendChild(blockElement);
        });
    }
}

// إنشاء عنصر بلوك
function createBlockElement(block) {
    const div = document.createElement('div');
    div.className = 'block';
    div.dataset.id = block.id;
    div.dataset.token = block.token;
    
    // تحديد الأيقونة حسب نوع الملف
    let fileIcon = '📄';
    if (block.type === 'file') {
        const fileExt = block.content.split('.').pop().toLowerCase();
        if (['mp3', 'wav', 'ogg'].includes(fileExt)) fileIcon = '🎵';
        else if (['mp4', 'avi', 'mov', 'webm'].includes(fileExt)) fileIcon = '🎬';
        else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) fileIcon = '🖼️';
        else if (['pdf'].includes(fileExt)) fileIcon = '📕';
        else if (['doc', 'docx'].includes(fileExt)) fileIcon = '📘';
    }
    
    div.innerHTML = `
        <div class="block-header">
            <h3 class="block-title">${block.type === 'text' ? '📝' : fileIcon} ${block.title}</h3>
            <div class="block-actions">
                <button class="block-action view-btn" title="View">👁️</button>
                <button class="block-action copy-btn" title="Copy Token">🔗</button>
                <button class="block-action delete-btn" title="Delete">🗑️</button>
            </div>
        </div>
        <div class="block-content" style="display: none;">
            ${block.type === 'text' ? truncateText(block.content, 100) : `File: ${block.content}`}
        </div>
        <div class="block-footer">
            <span class="block-type">${block.type}</span>
            <span class="block-date">Expires: ${formatDate(block.expiry)}</span>
            <span class="block-token">Token: ${block.token}</span>
        </div>
    `;
    
    // أحداث الأزرار
    const viewBtn = div.querySelector('.view-btn');
    const copyBtn = div.querySelector('.copy-btn');
    const deleteBtn = div.querySelector('.delete-btn');
    
    viewBtn.addEventListener('click', function() {
        if (block.type === 'text') {
            openContentModal(block);
        } else {
            openFileModal(block);
        }
    });
    
    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(block.token)
            .then(() => showToast('Token copied to clipboard'))
            .catch(() => showToast('Failed to copy token'));
    });
    
    deleteBtn.addEventListener('click', function() {
        deleteBlock(block.id);
    });
    
    return div;
}

// فتح نافذة الملف
function openFileModal(block) {
    const fileData = JSON.parse(localStorage.getItem(block.fileId));
    if (!fileData) {
        showToast('File not found');
        return;
    }
    
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalType = document.getElementById('modal-type');
    const modalDate = document.getElementById('modal-date');
    
    modalTitle.textContent = block.title;
    
    let fileTypeDisplay = fileData.type || 'Unknown';
    if (fileTypeDisplay === '') fileTypeDisplay = 'Unknown';
    
    modalType.textContent = `Type: ${block.type} (${fileTypeDisplay})`;
    modalDate.textContent = `Created: ${formatDate(block.created)}`;
    
    let contentHTML = '';
    const fileSize = (fileData.size / 1024).toFixed(2);
    
    if (fileData.type && fileData.type.startsWith('audio/')) {
        contentHTML = `
            <div style="text-align: center;">
                <audio controls style="width: 100%; margin: 15px 0;">
                    <source src="${fileData.data}" type="${fileData.type}">
                    Your browser does not support the audio element.
                </audio>
                <p>File: ${fileData.name}</p>
                <p>Size: ${fileSize} KB</p>
                <button onclick="downloadFile('${block.fileId}')" class="download-btn">
                    Download File
                </button>
            </div>
        `;
    } else if (fileData.type && fileData.type.startsWith('video/')) {
        contentHTML = `
            <div style="text-align: center;">
                <video controls style="width: 100%; max-height: 400px; margin: 15px 0;">
                    <source src="${fileData.data}" type="${fileData.type}">
                    Your browser does not support the video tag.
                </video>
                <p>File: ${fileData.name}</p>
                <p>Size: ${fileSize} KB</p>
                <button onclick="downloadFile('${block.fileId}')" class="download-btn">
                    Download File
                </button>
            </div>
        `;
    } else if (fileData.type && fileData.type.startsWith('image/')) {
        contentHTML = `
            <div style="text-align: center;">
                <img src="${fileData.data}" style="max-width: 100%; max-height: 400px; margin: 15px 0; border-radius: 8px;">
                <p>File: ${fileData.name}</p>
                <p>Size: ${fileSize} KB</p>
                <button onclick="downloadFile('${block.fileId}')" class="download-btn">
                    Download File
                </button>
            </div>
        `;
    } else {
        contentHTML = `
            <div style="text-align: center; margin: 20px 0;">
                <p>File: ${fileData.name}</p>
                <p>Type: ${fileTypeDisplay}</p>
                <p>Size: ${fileSize} KB</p>
                <button onclick="downloadFile('${block.fileId}')" class="download-btn">
                    Download File
                </button>
            </div>
        `;
    }
    
    modalContent.innerHTML = contentHTML;
    modal.style.display = 'block';
    
    increaseViewCount(block.id);
}

// دالة تحميل الملف
function downloadFile(fileId) {
    const fileData = JSON.parse(localStorage.getItem(fileId));
    if (!fileData) {
        showToast('File not found');
        return;
    }
    
    const link = document.createElement('a');
    link.href = fileData.data;
    link.download = fileData.name;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Download started');
}

// زيادة عدد المشاهدات
function increaseViewCount(blockId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[currentUser.email]) {
        const blockIndex = users[currentUser.email].blocks.findIndex(b => b.id === blockId);
        if (blockIndex !== -1) {
            users[currentUser.email].blocks[blockIndex].views = 
                (users[currentUser.email].blocks[blockIndex].views || 0) + 1;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
}

// حذف البلوك
async function deleteBlock(blockId) {
    if (confirm('Are you sure you want to delete this block?')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        try {
            const response = await fetch('/.netlify/functions/blocks', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentUser.email,
                    blockId: blockId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadBlocks();
                showToast('Block deleted successfully');
            } else {
                showToast('Error deleting block: ' + result.message);
            }
        } catch (error) {
            console.error('Delete block error:', error);
            showToast('Network error. Please try again.');
            
            // Fallback إلى localStorage إذا ال API فشل
            const users = JSON.parse(localStorage.getItem('users')) || {};
            
            if (users[currentUser.email]) {
                users[currentUser.email].blocks = users[currentUser.email].blocks.filter(b => b.id !== blockId);
                localStorage.setItem('users', JSON.stringify(users));
                loadBlocks();
                showToast('Block deleted successfully');
            }
        }
    }
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString || dateString === 'null') return 'Never expires';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Never expires';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// تقصير النص الطويل
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// فتح نافذة المحتوى
function openContentModal(block) {
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalType = document.getElementById('modal-type');
    const modalDate = document.getElementById('modal-date');
    
    modalTitle.textContent = block.title;
    modalContent.textContent = block.content;
    modalType.textContent = `Type: ${block.type}`;
    modalDate.textContent = `Created: ${formatDate(block.created)}`;
    
    modal.style.display = 'block';
    
    increaseViewCount(block.id);
}

// إعداد أحداث النافذة المنبثقة
function setupModalEvents() {
    const modal = document.getElementById('content-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    if (!closeBtn) return;
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            modal.style.display = 'none';
        }
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر القائمة المنسدلة للمستخدم
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function() {
            userDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
    
    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutUser();
        });
    }
    
    // البحث
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterBlocks(searchTerm);
        });
    }
}

// تصفية البلوكات
function filterBlocks(searchTerm) {
    const blocks = document.querySelectorAll('.block');
    
    blocks.forEach(block => {
        const title = block.querySelector('.block-title').textContent.toLowerCase();
        const content = block.querySelector('.block-content').textContent.toLowerCase();
        const token = block.dataset.token.toLowerCase();
        
        if (title.includes(searchTerm) || content.includes(searchTerm) || token.includes(searchTerm)) {
            block.style.display = 'block';
        } else {
            block.style.display = 'none';
        }
    });
}

// دالة تسجيل الخروج
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// دالة الإشعارات
function showToast(message) {
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// دالة التحقق من صلاحية البلوكات وحذف المنتهية
function checkExpiredBlocks() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (!users[currentUser.email]) return;
    
    const now = new Date();
    let changed = false;
    
    users[currentUser.email].blocks = users[currentUser.email].blocks.filter(block => {
        if (block.expiry && new Date(block.expiry) < now) {
            console.log(`Block "${block.title}" has been automatically deleted (expired)`);
            changed = true;
            return false;
        }
        return true;
    });
    
    if (changed) {
        localStorage.setItem('users', JSON.stringify(users));
        loadBlocks();
    }
}

// دالة لتشغيل الفحص كل دقيقة
function startExpiryChecker() {
    checkExpiredBlocks();
    setInterval(checkExpiredBlocks, 60000);
}