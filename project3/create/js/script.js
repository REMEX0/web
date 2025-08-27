function showForm(type) {
    const container = document.getElementById('form-container');
    container.innerHTML = '';

    if (type === 'text') {
        container.innerHTML = `
            <form onsubmit="handleSubmit(event, 'text')">
                <input type="text" id="block-title" placeholder="Block Title" required>
                <textarea id="block-content" placeholder="Write your text here..." required></textarea>
                <label for="expiry">Expiry:</label>
                <select id="expiry" required>
                    <option value="1h">1 Hour</option>
                    <option value="1d">1 Day</option>
                    <option value="1w">1 Week</option>
                    <option value="1m">1 Month</option>
                    <option value="1y">1 Year</option>
                    <option value="never" selected>Never</option>
                </select>
                <button class="submit-btn" type="submit">Post Text</button>
            </form>
        `;
    } 
    else if (type === 'file') {
        container.innerHTML = `
            <form onsubmit="handleSubmit(event, 'file')">
                <input type="text" id="block-title" placeholder="Block Title" required>
                
                <label for="file-type">File Type:</label>
                <select id="file-type" required onchange="updateFileAccept()">
                    <option value="">Select file type</option>
                    <option value="image">Image (PNG, JPG, GIF)</option>
                    <option value="video">Video (MP4, AVI, MOV)</option>
                    <option value="audio">Audio (MP3, WAV)</option>
                    <option value="document">Document (PDF, DOC, TXT)</option>
                    <option value="any">Any File Type</option>
                </select>
                
                <input type="file" id="block-file" required>
                <div id="file-preview" style="margin: 10px 0; display: none;"></div>
                
                <label for="expiry">Expiry:</label>
                <select id="expiry" required>
                    <option value="1h">1 Hour</option>
                    <option value="1d">1 Day</option>
                    <option value="1w">1 Week</option>
                    <option value="1m">1 Month</option>
                    <option value="1y">1 Year</option>
                    <option value="never" selected>Never</option>
                </select>
                
                <button class="submit-btn" type="submit">Upload File</button>
            </form>
        `;
        
        // إضافة event listener لعرض معاينة الملف
        document.getElementById('block-file').addEventListener('change', function(e) {
            previewFile(e.target.files[0]);
        });
    }
}

// تحديث نوع الملفات المقبولة حسب الاختيار
function updateFileAccept() {
    const fileType = document.getElementById('file-type').value;
    const fileInput = document.getElementById('block-file');
    
    switch(fileType) {
        case 'image':
            fileInput.accept = 'image/png,image/jpeg,image/gif';
            break;
        case 'video':
            fileInput.accept = 'video/mp4,video/avi,video/quicktime';
            break;
        case 'audio':
            fileInput.accept = 'audio/mpeg,audio/wav';
            break;
        case 'document':
            fileInput.accept = '.pdf,.doc,.docx,.txt';
            break;
        case 'any':
            fileInput.accept = '';
            break;
        default:
            fileInput.accept = '';
    }
    
    // reset file input when type changes
    fileInput.value = '';
    document.getElementById('file-preview').style.display = 'none';
}

// معاينة الملف قبل الرفع
function previewFile(file) {
    const preview = document.getElementById('file-preview');
    preview.innerHTML = '';
    preview.style.display = 'block';
    
    if (!file) return;
    
    const fileType = file.type.split('/')[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        if (fileType === 'image') {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
        } 
        else if (fileType === 'video') {
            preview.innerHTML = `
                <video controls style="max-width: 200px; max-height: 200px;">
                    <source src="${e.target.result}" type="${file.type}">
                    Your browser does not support the video tag.
                </video>
            `;
        }
        else if (fileType === 'audio') {
            preview.innerHTML = `
                <audio controls>
                    <source src="${e.target.result}" type="${file.type}">
                    Your browser does not support the audio element.
                </audio>
            `;
        }
        else {
            preview.innerHTML = `
                <div style="padding: 15px; background: #2b2b2b; border-radius: 8px;">
                    <p><strong>File Name:</strong> ${file.name}</p>
                    <p><strong>File Type:</strong> ${file.type || 'Unknown'}</p>
                    <p><strong>File Size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                </div>
            `;
        }
    };
    
    reader.readAsDataURL(file);
}

function handleSubmit(event, type) {
    event.preventDefault();
    
    // التحقق من تسجيل الدخول
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showToast('You must be logged in to create blocks');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
        return;
    }
    
    const title = document.getElementById('block-title').value;
    const expiry = document.getElementById('expiry').value;
    
    // نعمل generate لـ token عشوائي
    const token = generateToken(10);
    
    let content = '';
    let fileData = null;
    
    if (type === 'text') {
        content = document.getElementById('block-content').value;
        
        // للنصوص فقط
        const newBlock = createBlockObject(type, title, content, expiry, token);
        saveBlockToUser(currentUser, newBlock);
        
        showToast('Text block created successfully! ✅');
        setTimeout(() => {
            window.location.href = '../dashboard/index.html';
        }, 2000);
    } else {
        const fileInput = document.getElementById('block-file');
        const file = fileInput.files[0];
        
        if (!file) {
            showToast('Please select a file to upload');
            return;
        }
        
        // التحقق من حجم الملف (20MB كحد أقصى)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
            showToast('File size exceeds the maximum limit of 20MB');
            return;
        }
        
        content = file.name;
        
        // حفظ بيانات الملف
        const reader = new FileReader();
        reader.onload = function(e) {
            fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result // base64 encoded file data
            };
            
            // تخزين بيانات الملف في localStorage
            const fileId = 'file_' + Date.now();
            localStorage.setItem(fileId, JSON.stringify(fileData));
            
            // حفظ reference للملف في الblock
            const newBlock = createBlockObject(type, title, content, expiry, token, fileId);
            saveBlockToUser(currentUser, newBlock);
            
            showToast('File uploaded successfully! ✅');
            setTimeout(() => {
                window.location.href = '../dashboard/index.html';
            }, 2000);
        };
        reader.readAsDataURL(file);
    }
}

function createBlockObject(type, title, content, expiry, token, fileId = null) {
    const expiryDate = calculateExpiryDate(expiry);
    
    return {
        id: Date.now(),
        title,
        content,
        type,
        token,
        fileId,
        created: new Date().toISOString(),
        expiry: expiryDate,
        expiryOption: expiry, // نخزن الخيار الأصلي
        views: 0
    };
}

function saveBlockToUser(currentUser, newBlock) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (!users[currentUser.email]) {
        users[currentUser.email] = { blocks: [] };
    }
    
    users[currentUser.email].blocks.push(newBlock);
    localStorage.setItem('users', JSON.stringify(users));
}

// دالة إنشاء توكن
function generateToken(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// دالة حساب تاريخ الانتهاء
function calculateExpiryDate(expiryOption) {
    if (expiryOption === 'never') return null;
    
    const now = new Date();
    const option = expiryOption.substring(0, expiryOption.length - 1);
    const unit = expiryOption.substring(expiryOption.length - 1);
    
    let expiryDate = new Date(now);
    
    switch(unit) {
        case 'h':
            expiryDate.setHours(now.getHours() + parseInt(option));
            break;
        case 'd':
            expiryDate.setDate(now.getDate() + parseInt(option));
            break;
        case 'w':
            expiryDate.setDate(now.getDate() + (parseInt(option) * 7));
            break;
        case 'm':
            expiryDate.setMonth(now.getMonth() + parseInt(option));
            break;
        case 'y':
            expiryDate.setFullYear(now.getFullYear() + parseInt(option));
            break;
    }
    
    return expiryDate.toISOString();
}

// دالة الإشعارات
function showToast(message) {
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;

    document.body.appendChild(toast);

    // إظهار الرسالة
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // إخفاء الرسالة بعد 3 ثواني
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// دالة عرض الرسائل
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;
    
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
    messageBox.style.display = 'block';
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}