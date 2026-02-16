/**
 * WineMarks 个人网站 JavaScript
 */

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('WineMarks 网站已加载');

    // 初始化各种功能
    initMobileNav();
    initContactForm();
    initScrollAnimations();
    initSmoothScroll();
});

/**
 * 移动导航菜单（如果需要汉堡菜单）
 */
function initMobileNav() {
    // 这里可以添加移动端菜单切换功能
    // 当前使用的是简单的响应式设计，可根据需要扩展
}

/**
 * 联系表单处理
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formMessage = document.getElementById('formMessage');
        const formData = new FormData(contactForm);
        
        // 获取表单数据
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');
        
        // 基本验证
        if (!name || !email || !subject || !message) {
            showFormMessage('请填写所有必填字段', 'error');
            return;
        }
        
        // 邮箱验证
        if (!isValidEmail(email)) {
            showFormMessage('请输入有效的邮箱地址', 'error');
            return;
        }
        
        // 这里是示例代码
        // 实际使用时需要配置表单服务（如 Formspree、Netlify Forms 等）
        // 或者自己的后端 API
        
        console.log('表单数据：', {
            name: name,
            email: email,
            subject: subject,
            message: message
        });
        
        // 模拟提交成功（实际项目中应该发送到服务器）
        setTimeout(function() {
            showFormMessage('感谢您的消息！我会尽快回复。', 'success');
            contactForm.reset();
        }, 500);
        
        /* 
        // 使用 Formspree 的示例代码：
        fetch('https://formspree.io/f/YOUR_FORM_ID', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                showFormMessage('感谢您的消息！我会尽快回复。', 'success');
                contactForm.reset();
            } else {
                showFormMessage('发送失败，请稍后再试。', 'error');
            }
        })
        .catch(error => {
            showFormMessage('发送失败，请稍后再试。', 'error');
            console.error('错误：', error);
        });
        */
    });
}

/**
 * 显示表单消息
 */
function showFormMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    if (!formMessage) return;
    
    formMessage.textContent = message;
    formMessage.className = 'form-message ' + type;
    
    // 5 秒后自动隐藏
    setTimeout(function() {
        formMessage.className = 'form-message';
    }, 5000);
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 滚动动画
 */
function initScrollAnimations() {
    // 检查元素是否在视口中
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // 为需要动画的元素添加类
    const animatedElements = document.querySelectorAll('.feature-card, .update-item');
    
    function checkAnimation() {
        animatedElements.forEach(function(element) {
            if (isInViewport(element)) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    // 初始化样式
    animatedElements.forEach(function(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // 监听滚动
    window.addEventListener('scroll', checkAnimation);
    window.addEventListener('load', checkAnimation);
    checkAnimation(); // 首次检查
}

/**
 * 平滑滚动
 */
function initSmoothScroll() {
    // 为所有内部锚点链接添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // 忽略空锚点
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * 返回顶部按钮（可选功能）
 */
function initBackToTop() {
    // 创建返回顶部按钮
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '↑';
    backToTopButton.className = 'back-to-top';
    backToTopButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--secondary-color);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
    `;
    
    document.body.appendChild(backToTopButton);
    
    // 显示/隐藏按钮
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.style.opacity = '1';
            backToTopButton.style.visibility = 'visible';
        } else {
            backToTopButton.style.opacity = '0';
            backToTopButton.style.visibility = 'hidden';
        }
    });
    
    // 点击返回顶部
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 可选：启用返回顶部按钮
// initBackToTop();

/**
 * 深色模式切换（可选功能）
 */
function initDarkMode() {
    const darkModeToggle = document.createElement('button');
    darkModeToggle.textContent = '🌙';
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.style.cssText = `
        position: fixed;
        top: 80px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(darkModeToggle);
    
    // 检查本地存储中的主题偏好
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    }
    
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            darkModeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            darkModeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });
}

// 可选：启用深色模式
// initDarkMode();
