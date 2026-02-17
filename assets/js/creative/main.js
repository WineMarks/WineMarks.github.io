// ============================================
// 主入口脚本 - 协调所有模块
// ============================================

import { 
    checkWebGLSupport, 
    showUnsupportedMessage, 
    logDeviceInfo, 
    setupResizeHandler,
    RenderManager,
    PerformanceMonitor
} from './responsive.js';

import { 
    setupThreeJS, 
    scene, 
    camera, 
    renderer 
} from './scene-setup.js';

import { generatePapers, papers } from './paper-objects.js';
import { initScrollAnimations, scrollToSection } from './scroll-animations.js';

// 全局状态
let renderManager;
let perfMonitor;
let isInitialized = false;

// 初始化应用
async function init() {
    console.log('🚀 Initializing Floating Scrapbook...');
    
    // 1. 检查 WebGL 支持
    if (!checkWebGLSupport()) {
        console.error('WebGL not supported!');
        showUnsupportedMessage();
        hideLoader();
        return;
    }
    
    // 2. 打印设备信息
    logDeviceInfo();
    
    // 3. 初始化 Three.js 场景
    try {
        setupThreeJS(false); // debug = false（生产环境）
    } catch (error) {
        console.error('Failed to setup Three.js:', error);
        alert('初始化 3D 场景失败，请刷新页面重试');
        hideLoader();
        return;
    }
    
    // 4. 生成纸片对象
    generatePapers();
    
    // 5. 初始化滚动动画
    initScrollAnimations();
    
    // 6. 设置渲染管理器
    renderManager = new RenderManager(renderer, scene, camera);
    
    // 7. 设置性能监控（开发环境可选）
    // perfMonitor = new PerformanceMonitor();
    // perfMonitor.showStats(); // 显示 FPS
    
    // 8. 设置窗口调整处理
    setupResizeHandler(camera, renderer, () => {
        renderManager.markNeedsRender();
    });
    
    // 9. 启动渲染循环
    renderManager.startAnimation(() => {
        // 可以在这里添加每帧更新的逻辑
        // 例如：纸片悬浮效果、鼠标交互等
        
        // 性能监控更新
        // if (perfMonitor) perfMonitor.update();
    });
    
    // 10. 设置 ScrollTrigger 更新监听
    ScrollTrigger.addEventListener('refresh', () => {
        renderManager.markNeedsRender();
    });
    
    ScrollTrigger.addEventListener('update', () => {
        renderManager.markNeedsRender();
    });
    
    // 11. 设置 UI 交互
    setupUIInteractions();
    
    // 12. 隐藏加载指示器
    setTimeout(() => {
        hideLoader();
        isInitialized = true;
        console.log('✅ Initialization complete!');
    }, 1000);
}

// 隐藏加载指示器
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
    }
}

// 设置 UI 交互
function setupUIInteractions() {
    // 汉堡包菜单
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const closeMenu = document.querySelector('.close-menu');
    
    if (menuToggle && sideMenu) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('open');
        });
        
        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                sideMenu.classList.remove('open');
            });
        }
        
        // 点击菜单外部关闭
        document.addEventListener('click', (e) => {
            if (sideMenu.classList.contains('open') && 
                !sideMenu.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sideMenu.classList.remove('open');
            }
        });
    }
    
    // 导航链接
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            
            if (section) {
                scrollToSection(section);
                sideMenu.classList.remove('open');
            }
        });
    });
    
    // 键盘导航
    document.addEventListener('keydown', (e) => {
        // ESC 关闭菜单
        if (e.key === 'Escape' && sideMenu.classList.contains('open')) {
            sideMenu.classList.remove('open');
        }
        
        // 数字键快捷跳转
        const sectionKeys = {
            '1': 'intro',
            '2': 'about',
            '3': 'projects',
            '4': 'skills',
            '5': 'contact'
        };
        
        if (sectionKeys[e.key]) {
            scrollToSection(sectionKeys[e.key]);
        }
    });
    
    console.log('✓ UI interactions setup');
}

// 可选：添加纸片悬浮效果（鼠标交互）
function addHoverEffects() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener('mousemove', (event) => {
        // 计算鼠标位置（归一化设备坐标）
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // 更新射线
        raycaster.setFromCamera(mouse, camera);
        
        // 检测相交对象
        const intersects = raycaster.intersectObjects(papers);
        
        // 重置所有纸片缩放
        papers.forEach(paper => {
            gsap.to(paper.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.3
            });
        });
        
        // 高亮悬停的纸片
        if (intersects.length > 0) {
            const hoveredPaper = intersects[0].object;
            gsap.to(hoveredPaper.scale, {
                x: 1.1,
                y: 1.1,
                z: 1.1,
                duration: 0.3
            });
            
            document.body.style.cursor = 'pointer';
            renderManager.markNeedsRender();
        } else {
            document.body.style.cursor = 'default';
        }
    });
    
    console.log('✓ Hover effects added');
}

// 可选：添加点击纸片事件
function addClickEvents() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener('click', (event) => {
        // 忽略菜单点击
        if (event.target.closest('.hamburger-menu') || event.target.closest('.side-nav')) {
            return;
        }
        
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(papers);
        
        if (intersects.length > 0) {
            const clickedPaper = intersects[0].object;
            const data = clickedPaper.userData;
            
            console.log('Clicked paper:', data);
            
            // 可以在这里添加更多交互，例如：
            // - 显示详情弹窗
            // - 跳转到相关页面
            // - 播放动画等
            
            // 示例：旋转纸片
            gsap.to(clickedPaper.rotation, {
                y: clickedPaper.rotation.y + Math.PI * 2,
                duration: 1,
                ease: 'back.out',
                onUpdate: () => renderManager.markNeedsRender()
            });
        }
    });
    
    console.log('✓ Click events added');
}

// 页面可见性变化处理（性能优化）
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面不可见时暂停渲染
        if (renderManager) {
            renderManager.stopAnimation();
        }
        console.log('⏸ Animation paused (page hidden)');
    } else {
        // 页面可见时恢复渲染
        if (renderManager && isInitialized) {
            renderManager.startAnimation();
            renderManager.markNeedsRender();
        }
        console.log('▶ Animation resumed (page visible)');
    }
});

// 等待 DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 导出供外部使用（调试）
window.floatingScrapbook = {
    scene,
    camera,
    renderer,
    papers,
    scrollToSection,
    renderManager,
    addHoverEffects,
    addClickEvents
};

console.log('💡 Tip: Access debugging tools via window.floatingScrapbook');
