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
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;
        
        // تسجيل الدخول عبر API
        try {
            const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // حفظ المستخدم الحالي في localStorage
                localStorage.setItem('currentUser', JSON.stringify({ email }));
                window.location.href = './dashboard/index.html';
            } else {
                alert(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Network error. Please try again.');
        }
    });
    
    // تسجيل مستخدم جديد
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;
        const confirmPassword = this.querySelector('input[placeholder="Confirm Password"]').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        // تسجيل مستخدم جديد عبر API
        try {
            const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'register',
                    email,
                    password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // حفظ المستخدم الحالي في localStorage
                localStorage.setItem('currentUser', JSON.stringify({ email }));
                alert('Registration successful! You are now logged in.');
                window.location.href = './dashboard/index.html';
            } else {
                alert(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Network error. Please try again.');
        }
    });
});