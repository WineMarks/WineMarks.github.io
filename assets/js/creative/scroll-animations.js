// ============================================
// GSAP ScrollTrigger 滚动动画模块
// ============================================

import { camera } from './scene-setup.js';
import { papers, calculateGridPositions } from './paper-objects.js';

// 注册 GSAP 插件
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// 滚动配置
const scrollConfig = {
    // 总滚动高度（视口高度的倍数）
    totalHeight: 5,
    
    // 章节断点（百分比）
    sections: {
        intro: { start: 0, end: 0.15 },      // 开场：0-15%
        flythrough: { start: 0.15, end: 0.50 }, // 穿梭飞行：15-50%
        showcase: { start: 0.50, end: 0.70 },   // 作品展示：50-70%
        gather: { start: 0.70, end: 1.0 }       // 聚合网格：70-100%
    }
};

// 初始化滚动容器
export function setupScrollContainer() {
    // 设置 body 高度以启用滚动
    const scrollHeight = window.innerHeight * scrollConfig.totalHeight;
    document.body.style.height = `${scrollHeight}px`;
    
    console.log(`✓ Scroll container setup (height: ${scrollHeight}px)`);
}

// 章节 1：开场动画（散乱纸片轻微摆动）
function setupIntroAnimation() {
    const { start, end } = scrollConfig.sections.intro;
    
    // 摄像机缓慢推进
    gsap.to(camera.position, {
        z: 800,
        scrollTrigger: {
            start: `${start * 100}% top`,
            end: `${end * 100}% top`,
            scrub: 1,
            // markers: true, // 调试用
        }
    });
    
    // 纸片轻微旋转和位置偏移
    papers.forEach((paper, i) => {
        const rotationOffset = (i % 2 === 0 ? 1 : -1) * 0.15;
        const positionOffset = (i % 3) * 20;
        
        gsap.to(paper.rotation, {
            y: paper.rotation.y + rotationOffset,
            x: paper.rotation.x + rotationOffset * 0.5,
            scrollTrigger: {
                start: `${start * 100}% top`,
                end: `${end * 100}% top`,
                scrub: true,
            }
        });
        
        gsap.to(paper.position, {
            y: paper.position.y + positionOffset,
            scrollTrigger: {
                start: `${start * 100}% top`,
                end: `${end * 100}% top`,
                scrub: true,
            }
        });
    });
    
    console.log('✓ Intro animation setup');
}

// 章节 2：穿梭飞行（摄像机在 3D 空间中移动）
function setupFlythroughAnimation() {
    const { start, end } = scrollConfig.sections.flythrough;
    
    // 摄像机沿 Z 轴深入，同时左右摇摆
    const timeline = gsap.timeline({
        scrollTrigger: {
            start: `${start * 100}% top`,
            end: `${end * 100}% top`,
            scrub: 1,
        }
    });
    
    timeline
        .to(camera.position, {
            z: -500,
            x: -300,
            y: 100,
            duration: 0.4,
        })
        .to(camera.position, {
            x: 200,
            y: -50,
            duration: 0.3,
        })
        .to(camera.position, {
            z: -1200,
            x: 0,
            y: 0,
            duration: 0.3,
        });
    
    // 摄像机视线跟随路径
    gsap.to(camera.rotation, {
        z: 0.1,
        scrollTrigger: {
            start: `${start * 100}% top`,
            end: `${(start + end) / 2 * 100}% top`,
            scrub: true,
        }
    });
    
    gsap.to(camera.rotation, {
        z: 0,
        scrollTrigger: {
            start: `${(start + end) / 2 * 100}% top`,
            end: `${end * 100}% top`,
            scrub: true,
        }
    });
    
    // 纸片随摄像机接近而放大并旋转（视差效果）
    papers.forEach((paper, i) => {
        const scale = 1 + (i % 5) * 0.1;
        const rotationSpeed = (i % 3) * 0.2;
        
        gsap.to(paper.rotation, {
            y: paper.rotation.y + rotationSpeed,
            scrollTrigger: {
                start: `${start * 100}% top`,
                end: `${end * 100}% top`,
                scrub: true,
            }
        });
        
        gsap.to(paper.scale, {
            x: scale,
            y: scale,
            z: scale,
            scrollTrigger: {
                start: `${start * 100}% top`,
                end: `${end * 100}% top`,
                scrub: true,
            }
        });
    });
    
    console.log('✓ Flythrough animation setup');
}

// 章节 3：作品展示（摄像机缓慢环绕）
function setupShowcaseAnimation() {
    const { start, end } = scrollConfig.sections.showcase;
    
    // 摄像机环绕运动
    gsap.to(camera.position, {
        z: -800,
        x: -100,
        scrollTrigger: {
            start: `${start * 100}% top`,
            end: `${end * 100}% top`,
            scrub: 1,
        }
    });
    
    // 纸片缩放恢复
    papers.forEach((paper) => {
        gsap.to(paper.scale, {
            x: 1,
            y: 1,
            z: 1,
            scrollTrigger: {
                start: `${start * 100}% top`,
                end: `${end * 100}% top`,
                scrub: true,
            }
        });
    });
    
    console.log('✓ Showcase animation setup');
}

// 章节 4：聚合网格（纸片从散乱到整齐排列）
function setupGatherAnimation() {
    const { start, end } = scrollConfig.sections.gather;
    
    // 计算网格位置
    const gridPositions = calculateGridPositions(5, 250);
    
    // 摄像机移动到网格正前方
    gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 600,
        scrollTrigger: {
            start: `${start * 100}% top`,
            end: `${end * 100}% top`,
            scrub: 1,
        }
    });
    
    // 摄像机视线归正
    gsap.to(camera.rotation, {
        x: 0,
        y: 0,
        z: 0,
        scrollTrigger: {
            start: `${start * 100}% top`,
            end: `${end * 100}% top`,
            scrub: 1,
        }
    });
    
    // 每个纸片移动到网格位置
    papers.forEach((paper, i) => {
        const targetPos = gridPositions[i];
        
        if (!targetPos) return;
        
        // 位置动画
        gsap.to(paper.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            scrollTrigger: {
                start: `${start * 100}% top`,
                end: `${end * 100}% top`,
                scrub: 1,
            }
        });
        
        // 旋转归零
        gsap.to(paper.rotation, {
            x: 0,
            y: 0,
            z: 0,
            scrollTrigger: {
                start: `${start * 100}% top`,
                end: `${end * 100}% top`,
                scrub: 1,
            }
        });
    });
    
    console.log('✓ Gather animation setup');
}

// 滚动进度条更新
function setupProgressBar() {
    ScrollTrigger.create({
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = `${self.progress * 100}%`;
            }
        }
    });
    
    console.log('✓ Progress bar setup');
}

// 滚动提示器淡出
function setupScrollIndicator() {
    const indicator = document.querySelector('.scroll-indicator');
    
    if (indicator) {
        ScrollTrigger.create({
            start: 'top top',
            end: '10% top',
            onUpdate: (self) => {
                indicator.style.opacity = 1 - self.progress;
            }
        });
    }
    
    console.log('✓ Scroll indicator setup');
}

// 初始化所有滚动动画
export function initScrollAnimations() {
    setupScrollContainer();
    setupIntroAnimation();
    setupFlythroughAnimation();
    setupShowcaseAnimation();
    setupGatherAnimation();
    setupProgressBar();
    setupScrollIndicator();
    
    console.log('✓ All scroll animations initialized');
}

// 平滑滚动到指定章节
export function scrollToSection(sectionName) {
    const section = scrollConfig.sections[sectionName];
    
    if (!section) {
        console.warn(`Section "${sectionName}" not found`);
        return;
    }
    
    const targetScroll = window.innerHeight * scrollConfig.totalHeight * section.start;
    
    gsap.to(window, {
        scrollTo: targetScroll,
        duration: 1.5,
        ease: 'power2.inOut'
    });
    
    console.log(`Scrolling to section: ${sectionName} (${targetScroll}px)`);
}

// 获取当前章节
export function getCurrentSection() {
    const scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    
    for (const [name, section] of Object.entries(scrollConfig.sections)) {
        if (scrollProgress >= section.start && scrollProgress < section.end) {
            return name;
        }
    }
    
    return null;
}

export default {
    initScrollAnimations,
    scrollToSection,
    getCurrentSection,
    scrollConfig
};
