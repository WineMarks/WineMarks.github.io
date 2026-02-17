// ============================================================
// main.js — "Digital Scrapbook" 核心交互逻辑
// 模块入口: Three.js 背景 · GSAP 滚动叙事 · Lenis 惯性滚动
// ============================================================

import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders.js';

// ── 全局引用 ────────────────────────────────────────────────
let renderer, scene, camera, shaderMaterial;
let lenis;
let mouseTarget = { x: 0.5, y: 0.5 };   // 鼠标目标位置 (归一化)
let mouseCurrent = { x: 0.5, y: 0.5 };   // 鼠标当前插值位置
const clock = new THREE.Clock();

// ── 配置常量 ────────────────────────────────────────────────
const CONFIG = {
  // 鼠标跟随插值速度 (0~1, 越小越平滑/越慢)
  mouseLerp: 0.06,
  // Lenis 平滑滚动参数
  lenisDuration: 1.2,
  lenisLerp: 0.1,
  // GSAP 动画默认缓动
  defaultEase: 'expo.out',
  // Glitch 乱码持续时间 (ms)
  glitchDuration: 150,
  // Glitch 乱码字符集
  glitchChars: '█▓▒░╔╗╚╝║═╠╣╬▲▶▼◀●◆★!@#$%^&*<>{}[]01',
};

// ============================================================
//  1. 加载器 (Loader)
// ============================================================
function initLoader() {
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loader-bar-inner');
  if (!loader) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 25;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      // 加载完成, 隐藏  loader 后启动入场动画
      setTimeout(() => {
        loader.classList.add('hidden');
        playEntrance();
      }, 400);
    }
    bar.style.width = `${progress}%`;
  }, 200);
}

// ============================================================
//  2. Lenis 惯性平滑滚动
// ============================================================
/**
 * 初始化 Lenis 平滑滚动
 * 参数调节:
 *   duration  — 滚动动画时长 (秒), 越大越慢
 *   lerp      — 线性插值系数, 越小越平滑
 *   smoothWheel — 鼠标滚轮是否平滑
 */
function initLenis() {
  lenis = new Lenis({
    duration: CONFIG.lenisDuration,
    lerp: CONFIG.lenisLerp,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });

  // 桥接 Lenis 与 GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  // 将 Lenis 的 raf 挂载到 GSAP ticker (统一帧率)
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);   // 防抖动
}

// ============================================================
//  3. Three.js WebGL 着色器背景
// ============================================================
/**
 * 初始化 Three.js 全屏着色器背景
 * 着色器效果由 shaders.js 定义 (噪点流场 + RGB 色差)
 *
 * 如需修改效果:
 *   → 调整 shaders.js 中的 #define 常量
 *   → 修改下方 uniforms 的初始值
 */
function initWebGL() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  // ── 渲染器 ──────────────────────────────
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,             // 不透明背景 (着色器自己画底色)
    antialias: false,         // 全屏着色器不需要抗锯齿
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));   // 限制 DPR 防止性能问题

  // ── 场景与相机 ──────────────────────────
  scene = new THREE.Scene();
  // 正交相机, 坐标空间 -1~1 (配合全屏四边形)
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ── 着色器材质 ──────────────────────────
  shaderMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      u_time:       { value: 0 },
      u_mouse:      { value: new THREE.Vector2(0.5, 0.5) },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    // 解除深度测试, 全屏渲染
    depthWrite: false,
    depthTest: false,
  });

  // ── 全屏四边形 ──────────────────────────
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, shaderMaterial);
  scene.add(mesh);

  // ── 鼠标监听 ────────────────────────────
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  // 触摸兼容
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouseTarget.x = e.touches[0].clientX / window.innerWidth;
      mouseTarget.y = 1.0 - e.touches[0].clientY / window.innerHeight;
    }
  }, { passive: true });
}

function onMouseMove(e) {
  mouseTarget.x = e.clientX / window.innerWidth;
  mouseTarget.y = 1.0 - e.clientY / window.innerHeight;   // 翻转 Y 轴 (WebGL 坐标系)
}

// ============================================================
//  4. GSAP + ScrollTrigger 注册与动画
// ============================================================
function initGSAP() {
  gsap.registerPlugin(ScrollTrigger);

  // ── Hero 入场动画 (由 playEntrance 触发) ──
  // 预设初始状态: 隐藏
  gsap.set('.hero-title .line-inner', {
    y: 120,
    rotateZ: 6,
    opacity: 0,
  });
  gsap.set('.hero-subtitle', { opacity: 0, y: 30 });
  gsap.set('.hero-scroll-hint', { opacity: 0, y: 20 });

  // ── About 滚动显现 ─────────────────────
  setupAboutAnimation();

  // ── Works 视差 + 散开 ──────────────────
  setupWorksAnimation();

  // ── Contact 入场 ───────────────────────
  setupContactAnimation();
}

/**
 * Hero 入场动画 (加载完成后播放)
 */
function playEntrance() {
  const tl = gsap.timeline({ defaults: { ease: CONFIG.defaultEase } });

  tl.to('.hero-title .line-inner', {
    y: 0,
    rotateZ: 0,
    opacity: 1,
    duration: 1.4,
    stagger: 0.12,
  })
  .to('.hero-subtitle', {
    opacity: 0.85,
    y: 0,
    duration: 0.8,
  }, '-=0.6')
  .to('.hero-scroll-hint', {
    opacity: 1,
    y: 0,
    duration: 0.6,
  }, '-=0.3');
}

/**
 * About Section — 滚动进入时文字 & 装饰卡片渐入
 */
function setupAboutAnimation() {
  // 左侧文字
  gsap.from('.about-content', {
    scrollTrigger: {
      trigger: '.about',
      start: 'top 75%',
      end: 'top 25%',
      toggleActions: 'play none none reverse',
    },
    y: 80,
    opacity: 0,
    duration: 1.2,
    ease: CONFIG.defaultEase,
  });

  // 右侧装饰照片
  gsap.from('.about-decoration .deco-card', {
    scrollTrigger: {
      trigger: '.about',
      start: 'top 70%',
      toggleActions: 'play none none reverse',
    },
    y: 60,
    opacity: 0,
    rotation: 15,
    stagger: 0.2,
    duration: 1,
    ease: CONFIG.defaultEase,
  });
}

/**
 * Works Section — 作品卡片视差滚动 + 散开效果
 *
 * 调节参数:
 *   scrub    — 滚动同步绑定 (1 = 1秒延迟跟随)
 *   yPercent — 视差位移百分比 (越大视差越强)
 */
function setupWorksAnimation() {
  const cards = gsap.utils.toArray('.work-card');

  // 入场: 卡片从堆叠状态散开到各自位置
  gsap.from(cards, {
    scrollTrigger: {
      trigger: '.works',
      start: 'top 80%',
      end: 'top 20%',
      scrub: 1,
    },
    // 堆叠到中心点
    x: (i) => {
      const offset = (i % 2 === 0) ? -200 : 200;
      return offset;
    },
    y: 300,
    rotation: (i) => (i % 2 === 0 ? -25 : 20),
    opacity: 0,
    scale: 0.8,
    stagger: 0.05,
    ease: 'none',   // scrub 模式下用 'none' 最平滑
  });

  // 视差: 滚动时每张卡片以不同速度移动
  cards.forEach((card, i) => {
    // 奇数/偶数卡片不同方向的视差
    const yOffset = (i % 2 === 0) ? -60 : -120;
    const rotateOffset = (i % 3 === 0) ? 3 : -2;

    gsap.to(card, {
      scrollTrigger: {
        trigger: '.works',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,      // 调大 = 更平滑但延迟更大
      },
      y: `+=${yOffset}`,
      rotation: `+=${rotateOffset}`,
      ease: 'none',
    });
  });
}

/**
 * Contact Section — 巨大邮箱链接入场
 */
function setupContactAnimation() {
  gsap.from('.contact-email', {
    scrollTrigger: {
      trigger: '.contact',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
    y: 100,
    opacity: 0,
    letterSpacing: '0.5em',
    duration: 1.2,
    ease: CONFIG.defaultEase,
  });

  gsap.from('.contact-socials a', {
    scrollTrigger: {
      trigger: '.contact',
      start: 'top 70%',
      toggleActions: 'play none none reverse',
    },
    y: 30,
    opacity: 0,
    stagger: 0.1,
    duration: 0.8,
    ease: CONFIG.defaultEase,
  });
}

// ============================================================
//  5. Glitch Bio — 关键词悬停弹窗 + 乱码特效
// ============================================================
function initGlitchBio() {
  const words = document.querySelectorAll('.glitch-word');
  const popup = createPopupElement();

  words.forEach((word) => {
    word.addEventListener('mouseenter', (e) => {
      // 启动文字乱码效果
      triggerGlitch(word);
      // 显示图片弹窗
      showPopup(popup, word, e);
    });

    word.addEventListener('mousemove', (e) => {
      movePopup(popup, e);
    });

    word.addEventListener('mouseleave', () => {
      hidePopup(popup);
      word.classList.remove('glitching');
    });
  });
}

/**
 * 创建全局图片弹窗元素 (只创建一次, 复用)
 */
function createPopupElement() {
  const popup = document.createElement('div');
  popup.className = 'keyword-popup';
  popup.innerHTML = `
    <img src="" alt="关键词图片">
    <span class="popup-label"></span>
  `;
  document.body.appendChild(popup);
  return popup;
}

/**
 * 文字乱码特效
 * 快速将文字替换为随机字符, 然后恢复原文
 */
function triggerGlitch(el) {
  const original = el.getAttribute('data-text') || el.textContent;
  el.classList.add('glitching');

  let iterations = 0;
  const maxIterations = 6;

  const interval = setInterval(() => {
    el.textContent = original
      .split('')
      .map((char, i) => {
        if (i < iterations) return original[i];
        return CONFIG.glitchChars[Math.floor(Math.random() * CONFIG.glitchChars.length)];
      })
      .join('');

    iterations += 1 / 2;
    if (iterations >= original.length) {
      el.textContent = original;
      clearInterval(interval);
    }
  }, CONFIG.glitchDuration / maxIterations);
}

/**
 * 显示弹窗并加载对应图片
 */
function showPopup(popup, word, e) {
  const imgSrc = word.getAttribute('data-img');
  const label = word.getAttribute('data-label') || '';

  popup.querySelector('img').src = imgSrc;
  popup.querySelector('.popup-label').textContent = label;
  movePopup(popup, e);

  // 延迟一帧再显示 (确保定位已更新)
  requestAnimationFrame(() => {
    popup.classList.add('visible');
  });
}

function movePopup(popup, e) {
  // 弹窗定位: 鼠标右上方偏移
  const offsetX = 20;
  const offsetY = -20;
  let x = e.clientX + offsetX;
  let y = e.clientY + offsetY;

  // 边界检测: 不超出视口
  const rect = popup.getBoundingClientRect();
  if (x + 280 > window.innerWidth) x = e.clientX - 300;
  if (y - 200 < 0) y = e.clientY + 30;

  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
}

function hidePopup(popup) {
  popup.classList.remove('visible');
}

// ============================================================
//  6. Contact Email 字符拆分 (波浪悬停效果)
// ============================================================
function initContactChars() {
  const emailLink = document.querySelector('.contact-email');
  if (!emailLink) return;

  const text = emailLink.textContent.trim();
  emailLink.innerHTML = text
    .split('')
    .map((char) => `<span class="char">${char}</span>`)
    .join('');
}

// ============================================================
//  7. 窗口自适应 (Resize)
// ============================================================
function handleResize() {
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  if (shaderMaterial) {
    shaderMaterial.uniforms.u_resolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  }

  // 刷新 ScrollTrigger 的计算位置
  ScrollTrigger.refresh();
}

// ============================================================
//  8. 主渲染循环 (rAF)
// ============================================================
function animate() {
  requestAnimationFrame(animate);

  // 递增时间
  if (shaderMaterial) {
    shaderMaterial.uniforms.u_time.value = clock.getElapsedTime();
  }

  // 鼠标位置平滑插值 (lerp)
  mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * CONFIG.mouseLerp;
  mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * CONFIG.mouseLerp;

  if (shaderMaterial) {
    shaderMaterial.uniforms.u_mouse.value.set(mouseCurrent.x, mouseCurrent.y);
  }

  // 渲染
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// ============================================================
//  9. 初始化入口
// ============================================================
function init() {
  // 1) 加载画面
  initLoader();

  // 2) Lenis 平滑滚动 (须在 GSAP 之前, 因为 ScrollTrigger 需要桥接)
  initLenis();

  // 3) WebGL 着色器背景
  initWebGL();

  // 4) GSAP 动画系统
  initGSAP();

  // 5) 关键词悬停交互
  initGlitchBio();

  // 6) 邮箱字符拆分
  initContactChars();

  // 7) 窗口大小监听 (使用防抖)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 150);
  });

  // 8) 启动渲染循环
  animate();
}

// ── DOM 就绪后启动 ──────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
