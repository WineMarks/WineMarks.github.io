// ============================================
// 响应式与性能优化模块
// ============================================

// 设备检测
export const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
export const isTablet = /(iPad|Android(?!.*Mobile))/i.test(navigator.userAgent);
export const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

// 性能配置
export const performanceConfig = {
    // 移动端或低性能设备
    simplified: isMobile || isLowPerformance,
    
    // 纸片数量
    maxPapers: (isMobile || isLowPerformance) ? 15 : 30,
    
    // 渲染配置
    pixelRatio: isMobile ? 1 : Math.min(window.devicePixelRatio, 2),
    antialias: !isMobile,
    
    // 阴影配置
    shadows: !isMobile && !isLowPerformance,
    
    // 纹理分辨率
    textureSize: (isMobile || isLowPerformance) ? 512 : 1024,
};

// 打印设备信息（调试用）
export function logDeviceInfo() {
    console.log('Device Info:', {
        userAgent: navigator.userAgent,
        isMobile,
        isTablet,
        isLowPerformance,
        hardwareConcurrency: navigator.hardwareConcurrency,
        devicePixelRatio: window.devicePixelRatio,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        performanceConfig
    });
}

// 窗口调整处理器
export function setupResizeHandler(camera, renderer, onResize) {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
        // 防抖处理，避免频繁触发
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // 更新摄像机纵横比
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            
            // 更新渲染器尺寸
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            // 执行自定义回调
            if (onResize) {
                onResize();
            }
            
            console.log('Window resized:', `${window.innerWidth}x${window.innerHeight}`);
        }, 200);
    });
}

// 性能监控（可选）
export class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
    }
    
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // 如果 FPS 过低，可以触发降级
            if (this.fps < 20) {
                console.warn('Low FPS detected:', this.fps);
            }
        }
        
        return this.fps;
    }
    
    showStats() {
        const statsDiv = document.createElement('div');
        statsDiv.id = 'fps-stats';
        statsDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #0f0;
            padding: 5px 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            border-radius: 3px;
        `;
        document.body.appendChild(statsDiv);
        
        setInterval(() => {
            statsDiv.textContent = `FPS: ${this.fps}`;
        }, 100);
    }
}

// 按需渲染管理器
export class RenderManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.needsRender = true;
        this.isAnimating = false;
    }
    
    // 标记需要重新渲染
    markNeedsRender() {
        this.needsRender = true;
    }
    
    // 渲染一帧
    render() {
        if (this.needsRender) {
            this.renderer.render(this.scene, this.camera);
            this.needsRender = false;
        }
    }
    
    // 启动动画循环
    startAnimation(callback) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const animate = () => {
            if (!this.isAnimating) return;
            
            requestAnimationFrame(animate);
            
            // 执行自定义动画回调
            if (callback) {
                callback();
            }
            
            // 渲染
            this.render();
        };
        
        animate();
    }
    
    // 停止动画循环
    stopAnimation() {
        this.isAnimating = false;
    }
}

// 检测 WebGL 支持
export function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

// 显示不支持提示
export function showUnsupportedMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 40px;
        border: 3px solid #2b2b2b;
        box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.15);
        max-width: 500px;
        text-align: center;
        z-index: 10000;
        font-family: 'Noto Sans SC', sans-serif;
    `;
    
    message.innerHTML = `
        <h2 style="margin-bottom: 20px;">😔 浏览器不支持</h2>
        <p style="margin-bottom: 20px;">您的浏览器不支持 WebGL，无法显示 3D 效果。</p>
        <p style="color: #666;">建议使用最新版本的 Chrome、Firefox、Safari 或 Edge 浏览器。</p>
    `;
    
    document.body.appendChild(message);
}

export default {
    isMobile,
    isTablet,
    isLowPerformance,
    performanceConfig,
    logDeviceInfo,
    setupResizeHandler,
    PerformanceMonitor,
    RenderManager,
    checkWebGLSupport,
    showUnsupportedMessage
};
