// ============================================
// Three.js 场景初始化模块
// ============================================

import { performanceConfig } from './responsive.js';

// 场景、摄像机、渲染器
export let scene, camera, renderer;

// 初始化 Three.js 场景
export function initScene() {
    // 创建场景
    scene = new THREE.Scene();
    
    // 设置背景颜色（纸张色）
    scene.background = new THREE.Color(0xf4f1ea);
    
    // 可选：添加雾效（增加深度感）
    scene.fog = new THREE.Fog(0xf4f1ea, 1000, 3000);
    
    console.log('✓ Scene initialized');
    return scene;
}

// 初始化摄像机
export function initCamera() {
    const fov = 75; // 视野角度
    const aspect = window.innerWidth / window.innerHeight; // 纵横比
    const near = 0.1; // 近裁剪面
    const far = 5000; // 远裁剪面
    
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    
    // 设置初始位置（在 Z 轴正方向，向负方向看）
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);
    
    console.log('✓ Camera initialized at', camera.position);
    return camera;
}

// 初始化渲染器
export function initRenderer() {
    const canvas = document.getElementById('webgl-canvas');
    
    if (!canvas) {
        console.error('Canvas element not found!');
        return null;
    }
    
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: performanceConfig.antialias, // 根据设备性能决定
        alpha: false, // 不需要透明背景
        powerPreference: 'high-performance' // 优先使用高性能 GPU
    });
    
    // 设置渲染器尺寸
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 设置像素比（根据设备性能）
    renderer.setPixelRatio(performanceConfig.pixelRatio);
    
    // 启用阴影（仅在高性能设备上）
    if (performanceConfig.shadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    console.log('✓ Renderer initialized', {
        size: `${window.innerWidth}x${window.innerHeight}`,
        pixelRatio: performanceConfig.pixelRatio,
        antialias: performanceConfig.antialias,
        shadows: performanceConfig.shadows
    });
    
    return renderer;
}

// 初始化光照
export function initLights() {
    // 环境光（柔和整体照明）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // 主方向光（模拟太阳光）
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
    mainLight.position.set(200, 300, 100);
    
    // 启用阴影（高性能设备）
    if (performanceConfig.shadows) {
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 1000;
    }
    
    scene.add(mainLight);
    
    // 补光（从侧面，增加立体感）
    const fillLight = new THREE.DirectionalLight(0xffd5a3, 0.3);
    fillLight.position.set(-100, 50, 50);
    scene.add(fillLight);
    
    // 背光（从后方，勾勒轮廓）
    const backLight = new THREE.DirectionalLight(0x7ec8e3, 0.2);
    backLight.position.set(0, 0, -100);
    scene.add(backLight);
    
    console.log('✓ Lights initialized (ambient + 3 directional)');
}

// 添加参考网格（调试用，生产环境可移除）
export function addDebugGrid() {
    const gridHelper = new THREE.GridHelper(2000, 20, 0x888888, 0xcccccc);
    gridHelper.position.y = -500;
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);
    
    console.log('✓ Debug helpers added');
}

// 完整初始化（一键调用）
export function setupThreeJS(debug = false) {
    initScene();
    initCamera();
    initRenderer();
    initLights();
    
    if (debug) {
        addDebugGrid();
    }
    
    console.log('✓ Three.js setup complete');
    
    return { scene, camera, renderer };
}

export default {
    scene,
    camera,
    renderer,
    initScene,
    initCamera,
    initRenderer,
    initLights,
    addDebugGrid,
    setupThreeJS
};
