// ============================================================
// shaders.js — GLSL 着色器模块
// 用于 Three.js 全屏后处理式背景特效
// 效果: 流动噪点场 + 鼠标跟随 RGB 色差分离
// ============================================================

/**
 * 顶点着色器 — 标准全屏四边形
 * 将 PlaneGeometry(-1~1) 直接映射到裁剪空间，传递归一化 UV
 */
export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

/**
 * 片元着色器 — 噪点流场 + RGB 分离
 *
 * 可调参数（搜索下方常量修改）:
 * ─────────────────────────────────────────────
 *  NOISE_SCALE   噪点采样缩放 (越大 = 细节越密)       默认 3.0
 *  FLOW_SPEED    流场运动速度                         默认 0.15
 *  RGB_OFFSET    RGB 三通道采样偏移量 (色差强度)       默认 0.025
 *  MOUSE_RADIUS  鼠标影响半径                         默认 0.35
 *  MOUSE_STRENGTH 鼠标扰动强度                        默认 0.6
 *  GLOW_INTENSITY 荧光高亮强度                        默认 0.7
 *  BASE_BRIGHTNESS 基础亮度 (0=纯黑, 1=全亮)          默认 0.08
 * ─────────────────────────────────────────────
 */
export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float u_time;
  uniform vec2  u_mouse;      // 归一化坐标 (0~1)
  uniform vec2  u_resolution;  // 画布像素尺寸

  varying vec2 vUv;

  // ── 可调常量 ──────────────────────────────
  #define NOISE_SCALE     3.0
  #define FLOW_SPEED      0.15
  #define RGB_OFFSET      0.025
  #define MOUSE_RADIUS    0.35
  #define MOUSE_STRENGTH  0.6
  #define GLOW_INTENSITY  0.7
  #define BASE_BRIGHTNESS 0.08

  // ── Simplex 3D Noise ─────────────────────
  // Credit: Stefan Gustavson (webgl-noise)
  // https://github.com/stegu/webgl-noise
  vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(
      dot(p0, p0), dot(p1, p1),
      dot(p2, p2), dot(p3, p3)
    ));
    p0 *= norm.x; p1 *= norm.y;
    p2 *= norm.z; p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(
      dot(x0, x0), dot(x1, x1),
      dot(x2, x2), dot(x3, x3)
    ), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(
      dot(p0, x0), dot(p1, x1),
      dot(p2, x2), dot(p3, x3)
    ));
  }

  // ── FBM (分形布朗运动) ───────────────────
  // 叠加多层噪点增加细节丰富度
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // 修正宽高比
    vec2 uv = vUv;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uvAspect = vec2(uv.x * aspect, uv.y);

    // 时间驱动的流动
    float t = u_time * FLOW_SPEED;

    // ── 鼠标扰动 ──────────────────────────
    vec2 mouseAspect = vec2(u_mouse.x * aspect, u_mouse.y);
    float mouseDist = distance(uvAspect, mouseAspect);
    float mouseInfluence = smoothstep(MOUSE_RADIUS, 0.0, mouseDist) * MOUSE_STRENGTH;

    // 鼠标方向向量, 用于偏移噪点采样位置
    vec2 mouseDir = normalize(uvAspect - mouseAspect + 0.001);
    vec2 distortion = mouseDir * mouseInfluence * 0.3;

    // ── 基础噪点坐标 ─────────────────────
    vec3 noiseCoord = vec3(
      uvAspect * NOISE_SCALE + distortion,
      t
    );

    // ── RGB 通道分离采样 ─────────────────
    // 每个通道在略微不同的位置采样, 产生色差效果
    // 增大 RGB_OFFSET 可以加强色差
    float r = fbm(noiseCoord + vec3( RGB_OFFSET,  0.0,         0.0));
    float g = fbm(noiseCoord + vec3( 0.0,          RGB_OFFSET, 0.0));
    float b = fbm(noiseCoord + vec3(-RGB_OFFSET, -RGB_OFFSET,  0.0));

    // 鼠标附近增强色差
    float rgbBoost = mouseInfluence * 2.0;
    r = fbm(noiseCoord + vec3( RGB_OFFSET * (1.0 + rgbBoost),  0.0, 0.0));
    g = fbm(noiseCoord + vec3( 0.0, RGB_OFFSET * (1.0 + rgbBoost), 0.0));
    b = fbm(noiseCoord + vec3(-RGB_OFFSET * (1.0 + rgbBoost), -RGB_OFFSET * (1.0 + rgbBoost), 0.0));

    // ── 映射到目标色域 ─────────────────
    // 深炭灰底色 #1a1a1a → rgb(0.102)
    // 荧光酸性绿 #39ff14 → rgb(0.224, 1.0, 0.078)
    vec3 baseColor = vec3(BASE_BRIGHTNESS);
    vec3 accentGreen = vec3(0.224, 1.0, 0.078);
    vec3 accentRed   = vec3(1.0, 0.2, 0.2);

    // 噪点值映射到 0~1
    vec3 noiseRGB = vec3(r, g, b) * 0.5 + 0.5;

    // 高亮区域 (噪点峰值) 施加荧光绿
    float highlight = smoothstep(0.55, 0.85, noiseRGB.g) * GLOW_INTENSITY;

    // 鼠标附近施加错误红
    float redGlow = mouseInfluence * 0.4 * smoothstep(0.4, 0.7, noiseRGB.r);

    // 合成最终颜色
    vec3 color = baseColor;
    color += noiseRGB * 0.06;                         // 微弱的噪点纹理
    color += accentGreen * highlight * 0.15;          // 荧光绿高亮
    color += accentRed * redGlow * 0.3;               // 鼠标附近红色脉冲
    color += vec3(noiseRGB.r - noiseRGB.b) * 0.03;   // 微妙色差

    // ── 暗角 (Vignette) ──────────────────
    float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - 0.5) * 1.5);
    color *= vignette;

    // 确保不过曝
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;
