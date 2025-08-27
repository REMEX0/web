// auth.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleForm = document.getElementById('toggle-form');
    
    // التبديل بين نماذج الدخول والتسجيل
    toggleForm.addEventListener('click', function() {
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'flex';
            registerForm.style.display = 'none';
            toggleForm.innerHTML = 'Don\'t have an account? <a href="#">Register</a>';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'flex';
            toggleForm.innerHTML = 'Already have an account? <a href="#">Login</a>';
        }
    });
    
    // تسجيل الدخول
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;
        
        // تسجيل الدخول
        loginUser(email, password);
    });
    
    // تسجيل مستخدم جديد
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;
        const confirmPassword = this.querySelector('input[placeholder="Confirm Password"]').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        // تسجيل مستخدم جديد
        if (registerUser(email, password)) {
            alert('Registration successful! You are now logged in.');
            window.location.href = './dashboard/index.html';
        }
    });
});

// دالة تسجيل الدخول
function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    // التحقق من وجود المستخدم وكلمة المرور
    if (users[email] && users[email].password === password) {
        // حفظ المستخدم الحالي في localStorage
        localStorage.setItem('currentUser', JSON.stringify({ email }));
        
        // التوجيه إلى لوحة التحكم
        window.location.href = './dashboard/index.html';
    } else {
        alert('Invalid email or password');
    }
}

// دالة تسجيل مستخدم جديد
function registerUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    // التحقق من وجود المستخدم مسبقاً
    if (users[email]) {
        alert('User already exists');
        return false;
    }
    
    // إنشاء مستخدم جديد
    users[email] = {
        password: password,
        blocks: []
    };
    
    // الحفظ في localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    // تسجيل الدخول تلقائياً بعد التسجيل
    localStorage.setItem('currentUser', JSON.stringify({ email }));
    
    return true;
}

// دالة التحقق من المستخدم الحالي
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// دالة تسجيل الخروج
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}