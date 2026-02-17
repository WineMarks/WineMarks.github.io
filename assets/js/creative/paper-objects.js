// ============================================
// 纸片对象生成模块
// ============================================

import { scene } from './scene-setup.js';
import { performanceConfig } from './responsive.js';

// 纸片内容数据
const paperContents = [
    // 关于我
    { type: 'about', text: '关于我\n前端开发者\n创意爱好者', color: '#fefefe', x: 0, y: 0, z: -200 },
    { type: 'about', text: 'WineMarks\n探索 · 分享 · 创造', color: '#fff9e6', x: -300, y: 100, z: -400 },
    
    // 项目作品
    { type: 'project', text: '项目 #1\n个人博客系统', color: '#ffe6f0', highlight: '#ff6b9d', x: 200, y: -50, z: -600 },
    { type: 'project', text: '项目 #2\n交互式作品集', color: '#e6f7ff', highlight: '#4ecdc4', x: -250, y: 80, z: -800 },
    { type: 'project', text: '项目 #3\n响应式设计', color: '#fff4e6', highlight: '#ffa940', x: 100, y: -100, z: -1000 },
    { type: 'project', text: '项目 #4\nThree.js 可视化', color: '#f0e6ff', highlight: '#9254de', x: -150, y: 120, z: -1200 },
    
    // 技能标签
    { type: 'skill', text: 'HTML5 / CSS3', color: '#fefefe', tag: true, x: 300, y: 50, z: -1400 },
    { type: 'skill', text: 'JavaScript', color: '#fff9e6', tag: true, x: -100, y: -80, z: -1500 },
    { type: 'skill', text: 'Three.js', color: '#e6fff9', tag: true, x: 150, y: 90, z: -1600 },
    { type: 'skill', text: 'GSAP', color: '#ffe6f0', tag: true, x: -280, y: -20, z: -1700 },
    { type: 'skill', text: 'React', color: '#e6f7ff', tag: true, x: 50, y: 130, z: -1800 },
    { type: 'skill', text: 'WebGL', color: '#f0e6ff', tag: true, x: -200, y: 60, z: -1900 },
    { type: 'skill', text: 'UI/UX', color: '#fff4e6', tag: true, x: 250, y: -60, z: -2000 },
    { type: 'skill', text: '响应式设计', color: '#fefefe', tag: true, x: -50, y: 100, z: -2100 },
    
    // 联系方式
    { type: 'contact', text: '联系方式\nemail@example.com', color: '#e6fff9', x: 180, y: -90, z: -2200 },
    { type: 'contact', text: 'GitHub\ngithub.com/WineMarks', color: '#ffe6f0', x: -220, y: 40, z: -2300 },
    { type: 'contact', text: '欢迎交流合作！', color: '#fff9e6', x: 80, y: 110, z: -2400 },
    
    // 填充装饰性纸片
    { type: 'decorative', text: '✨', color: '#fff9e6', small: true, x: -350, y: 150, z: -500 },
    { type: 'decorative', text: '🎨', color: '#ffe6f0', small: true, x: 320, y: -120, z: -900 },
    { type: 'decorative', text: '💡', color: '#e6f7ff', small: true, x: -80, y: 140, z: -1300 },
    { type: 'decorative', text: '🚀', color: '#f0e6ff', small: true, x: 240, y: 80, z: -1750 },
    { type: 'decorative', text: '📱', color: '#fff4e6', small: true, x: -180, y: -110, z: -2050 },
    { type: 'decorative', text: '⚡', color: '#e6fff9', small: true, x: 150, y: 120, z: -2350 },
    
    // 额外内容（仅在高性能设备显示）
    { type: 'extra', text: 'Hexo\n静态博客生成器', color: '#fefefe', x: -300, y: -50, z: -700 },
    { type: 'extra', text: 'Node.js', color: '#e6fff9', tag: true, x: 200, y: 100, z: -1100 },
    { type: 'extra', text: 'Git / GitHub', color: '#fff9e6', tag: true, x: -150, y: -100, z: -1450 },
    { type: 'extra', text: 'VS Code', color: '#e6f7ff', tag: true, x: 100, y: 70, z: -1850 },
    { type: 'extra', text: '性能优化', color: '#ffe6f0', tag: true, x: -250, y: 90, z: -2150 },
    { type: 'extra', text: '开源贡献者', color: '#f0e6ff', x: 220, y: -70, z: -2450 },
    { type: 'extra', text: '持续学习中...', color: '#fff4e6', x: -100, y: 130, z: -2600 },
];

// 存储所有纸片对象
export const papers = [];

// 创建单个纸片
function createPaperCard(data, index) {
    // 根据类型和标签确定尺寸
    const isSmall = data.small || data.tag;
    const width = isSmall ? 150 : 200;
    const height = isSmall ? 100 : 280;
    
    // 创建几何体
    const geometry = new THREE.PlaneGeometry(width, height);
    
    // 创建 Canvas 纹理
    const canvas = document.createElement('canvas');
    const textureSize = performanceConfig.textureSize;
    canvas.width = textureSize;
    canvas.height = Math.round(textureSize * (height / width));
    
    const ctx = canvas.getContext('2d');
    
    // 绘制纸张背景
    ctx.fillStyle = data.color || '#fefefe';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加纸张纹理（细微噪点）
    if (!isSmall) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    // 绘制胶带装饰（概率性）
    if (Math.random() > 0.6 && !isSmall) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(0, 20, canvas.width, 40);
    }
    
    // 绘制高亮标记（如果有）
    if (data.highlight && !isSmall) {
        ctx.fillStyle = data.highlight;
        ctx.globalAlpha = 0.3;
        const highlightHeight = canvas.height / 3;
        ctx.fillRect(0, canvas.height - highlightHeight, canvas.width, highlightHeight);
        ctx.globalAlpha = 1;
    }
    
    // 绘制文字
    ctx.fillStyle = '#2b2b2b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 字体大小根据纸片大小调整
    const fontSize = isSmall ? textureSize / 8 : textureSize / 12;
    ctx.font = `bold ${fontSize}px 'Caveat', 'Noto Sans SC', cursive`;
    
    // 处理多行文字
    const lines = data.text.split('\n');
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;
    
    lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });
    
    // 为标签类型添加边框
    if (data.tag) {
        ctx.strokeStyle = '#2b2b2b';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    }
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // 创建材质
    const material = new THREE.MeshLambertMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: false,
    });
    
    // 创建网格
    const mesh = new THREE.Mesh(geometry, material);
    
    // 设置位置
    mesh.position.set(data.x, data.y, data.z);
    
    // 添加随机旋转（散乱效果）
    const rotationRange = isSmall ? 0.2 : 0.3;
    mesh.rotation.set(
        (Math.random() - 0.5) * rotationRange,
        (Math.random() - 0.5) * rotationRange,
        (Math.random() - 0.5) * 0.15
    );
    
    // 存储用户数据（用于动画和交互）
    mesh.userData = {
        ...data,
        originalPosition: mesh.position.clone(),
        originalRotation: mesh.rotation.clone(),
        index: index,
        isSmall: isSmall,
    };
    
    // 启用阴影（高性能设备）
    if (performanceConfig.shadows) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }
    
    return mesh;
}

// 生成所有纸片并添加到场景
export function generatePapers() {
    // 根据性能配置限制数量
    const maxPapers = performanceConfig.maxPapers;
    const contents = paperContents.slice(0, maxPapers);
    
    console.log(`Generating ${contents.length} paper cards (max: ${maxPapers})`);
    
    contents.forEach((data, index) => {
        const paper = createPaperCard(data, index);
        scene.add(paper);
        papers.push(paper);
    });
    
    console.log(`✓ ${papers.length} papers added to scene`);
    
    return papers;
}

// 计算网格布局位置
export function calculateGridPositions(cols = 5, spacing = 250) {
    const gridPositions = [];
    
    papers.forEach((paper, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = col * spacing - ((cols - 1) * spacing) / 2;
        const y = -row * spacing + 300;
        const z = -1000;
        
        gridPositions.push({ x, y, z });
    });
    
    return gridPositions;
}

// 获取某类型的纸片
export function getPapersByType(type) {
    return papers.filter(paper => paper.userData.type === type);
}

export default {
    papers,
    generatePapers,
    calculateGridPositions,
    getPapersByType
};
