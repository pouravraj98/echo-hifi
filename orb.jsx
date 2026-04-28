// Echo Voice Visualizer — 3 variants
// On-brand gradient: warm gold → coral → teal (matches dawn/mist palette)
// Includes a glass shimmer overlay on top of the bars/wave/blob.

const { useRef: __orbUseRef, useEffect: __orbUseEffect } = React;

// Single-color gradient — light teal → deep teal, matches brand accent
const ORB_STOPS = [
  [0.00, '#8AB3C2', 'rgba(138, 179, 194, 0.45)'],   // light teal
  [0.50, '#4A7A8E', 'rgba(74, 122, 142, 0.45)'],    // mid teal
  [1.00, '#2D5266', 'rgba(45, 82, 102, 0.45)'],     // deep teal
];

function __orbMakeGrad(ctx, x0, y0, x1, y1, soft = false) {
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  ORB_STOPS.forEach(([s, solid, transparent]) => grad.addColorStop(s, soft ? transparent : solid));
  return grad;
}

function __orbRoundRect(ctx, x, y, w, h, r) {
  if (h < r * 2) r = h / 2;
  if (w < r * 2) r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function Orb({
  width,
  height,
  size,
  state = 'idle',
  variant = 'bars',
}) {
  const W = width || (size ? size * 1.85 : 320);
  const H = height || (size ? size * 0.8 : 150);

  const canvasRef = __orbUseRef(null);
  const wrapRef = __orbUseRef(null);
  const stateRef = __orbUseRef(state);

  __orbUseEffect(() => { stateRef.current = state; }, [state]);

  __orbUseEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let raf;
    const t0 = performance.now();

    const bandCount = variant === 'bars' ? 20 : 64;
    const bands = new Array(bandCount).fill(0.1);
    const targets = new Array(bandCount).fill(0.1);
    // Per-band random phases so each bar has its own wobble — gives continuous,
    // smooth animation instead of stepped re-targeting.
    const phases = new Array(bandCount).fill(0).map(() => Math.random() * Math.PI * 2);
    const speedSeeds = new Array(bandCount).fill(0).map(() => 0.7 + Math.random() * 0.8);
    const noiseSeeds = new Array(bandCount).fill(0).map(() => 1.3 + Math.random() * 1.6);

    function updateTargets(t) {
      const s = stateRef.current;
      const energy = s === 'speaking' ? 0.95 : s === 'listening' ? 0.7 : s === 'thinking' ? 0.34 : 0.22;
      const speed = s === 'speaking' ? 3.6 : s === 'listening' ? 2.2 : s === 'thinking' ? 1.0 : 1.4;
      for (let i = 0; i < bandCount; i++) {
        const pos = i / (bandCount - 1);
        const bell = 0.55 + 0.45 * Math.sin(pos * Math.PI);
        // Sum of sines = continuous, organic noise. No steppy retargeting.
        const w1 = Math.sin(t * speed * speedSeeds[i] + phases[i]) * 0.5;
        const w2 = Math.sin(t * speed * 1.7 * speedSeeds[i] + phases[i] * noiseSeeds[i]) * 0.32;
        const w3 = Math.sin(t * speed * 0.55 * speedSeeds[i] + phases[i] * 0.6) * 0.18;
        const wave = (w1 + w2 + w3) * 0.5 + 0.5; // 0..1
        targets[i] = energy * bell * (0.3 + wave * 0.85);
      }
    }

    function drawBars(t) {
      const s = stateRef.current;
      const cy = H / 2;
      const padX = 18;
      const innerW = W - padX * 2;
      const gap = innerW / bandCount;
      const barW = gap * 0.62;          // narrower rods at tight spacing
      const maxBarH = H * 0.84;
      const baseline = s === 'thinking' ? 0.18 : s === 'idle' ? 0.12 : 0.22;
      const pulse = Math.sin(t * 2.4) * 0.04;

      // Compute bar geometry once so all layers stay in sync.
      const geom = [];
      for (let i = 0; i < bandCount; i++) {
        const amp = Math.max(baseline + pulse, bands[i]);
        const barH = amp * maxBarH;
        const x = padX + i * gap + (gap - barW) / 2;
        const y = cy - barH / 2;
        geom.push({ x, y, w: barW, h: barH });
      }

      // 1. Soft outer halo (the "lit from behind" glow). Spread + low opacity.
      ctx.save();
      ctx.filter = 'blur(14px)';
      ctx.fillStyle = __orbMakeGrad(ctx, padX, 0, padX + innerW, 0, true);
      ctx.globalAlpha = 0.7;
      geom.forEach(g => {
        __orbRoundRect(ctx, g.x - 6, g.y - 6, g.w + 12, g.h + 12, g.w / 2 + 6);
        ctx.fill();
      });
      ctx.restore();

      // 2. Glass body — bar's own colour, mostly opaque with a hint of see-through.
      ctx.save();
      ctx.fillStyle = __orbMakeGrad(ctx, padX, 0, padX + innerW, 0, false);
      ctx.globalAlpha = 0.78;
      geom.forEach(g => {
        __orbRoundRect(ctx, g.x, g.y, g.w, g.h, g.w / 2);
        ctx.fill();
      });
      ctx.restore();

      // 3. Inner rim — bright thin edge along the left side of each bar.
      //    Adds the wet/glass reflection that makes them feel solid + premium.
      ctx.save();
      geom.forEach(g => {
        const rim = ctx.createLinearGradient(g.x, 0, g.x + g.w, 0);
        rim.addColorStop(0, 'rgba(255,255,255,0.55)');
        rim.addColorStop(0.25, 'rgba(255,255,255,0.10)');
        rim.addColorStop(0.7, 'rgba(255,255,255,0)');
        rim.addColorStop(1, 'rgba(0,0,0,0.18)'); // subtle right-edge shadow
        ctx.fillStyle = rim;
        __orbRoundRect(ctx, g.x, g.y, g.w, g.h, g.w / 2);
        ctx.fill();
      });
      ctx.restore();

      // 4. Top + bottom caps — glassy specular highlights at each end.
      ctx.save();
      geom.forEach(g => {
        const capH = Math.min(g.h * 0.45, 18);
        const topGrad = ctx.createLinearGradient(0, g.y, 0, g.y + capH);
        topGrad.addColorStop(0, 'rgba(255,255,255,0.55)');
        topGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = topGrad;
        __orbRoundRect(ctx, g.x, g.y, g.w, capH, g.w / 2);
        ctx.fill();
      });
      ctx.restore();

      // 5. Drifting diagonal shimmer (the moving light catch).
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const shimmerPos = ((t * 0.16) % 1.6) - 0.3;
      const sx0 = padX + innerW * (shimmerPos - 0.18);
      const sx1 = padX + innerW * (shimmerPos + 0.18);
      const shimmer = ctx.createLinearGradient(sx0, 0, sx1, H);
      shimmer.addColorStop(0, 'rgba(255,255,255,0)');
      shimmer.addColorStop(0.5, 'rgba(255,255,255,0.22)');
      shimmer.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shimmer;
      geom.forEach(g => {
        __orbRoundRect(ctx, g.x, g.y, g.w, g.h, g.w / 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function drawWave(t) {
      const s = stateRef.current;
      const cy = H / 2;
      const padX = 8;
      const innerW = W - padX * 2;
      const baseline = s === 'thinking' ? 0.18 : s === 'idle' ? 0.10 : 0.30;
      const speedMod = s === 'speaking' ? 1.6 : s === 'listening' ? 1.1 : s === 'thinking' ? 0.5 : 0.8;

      const points = [];
      const samples = 200;
      for (let i = 0; i <= samples; i++) {
        const x = padX + (i / samples) * innerW;
        const u = i / samples;
        const bandIdx = Math.floor(u * (bandCount - 1));
        const bandFrac = u * (bandCount - 1) - bandIdx;
        const bandAmp = bands[bandIdx] * (1 - bandFrac) + (bands[bandIdx + 1] || 0) * bandFrac;
        const env = Math.max(baseline, bandAmp);
        const w1 = Math.sin(u * 9 + t * 3.0 * speedMod) * 0.5;
        const w2 = Math.sin(u * 17 + t * 4.2 * speedMod) * 0.3;
        const w3 = Math.sin(u * 5 + t * 1.8 * speedMod) * 0.2;
        const edge = Math.sin(u * Math.PI);
        const y = cy + (w1 + w2 + w3) * env * (H * 0.4) * edge;
        points.push([x, y]);
      }

      function drawPath(width, color, blur = 0) {
        ctx.save();
        if (blur) ctx.filter = `blur(${blur}px)`;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i][0] + points[i + 1][0]) / 2;
          const yc = (points[i][1] + points[i + 1][1]) / 2;
          ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
        }
        ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
        ctx.stroke();
        ctx.restore();
      }

      drawPath(18, __orbMakeGrad(ctx, padX, 0, padX + innerW, 0, true), 10);
      drawPath(8, __orbMakeGrad(ctx, padX, 0, padX + innerW, 0, false), 0);
      drawPath(2.5, 'rgba(255,255,255,0.85)', 0);

      // Reflection
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.scale(1, -1);
      ctx.translate(0, -H);
      drawPath(5, __orbMakeGrad(ctx, padX, 0, padX + innerW, 0, true), 5);
      ctx.restore();
    }

    function drawBlob(t) {
      const s = stateRef.current;
      const cx = W / 2, cy = H / 2;
      const baseR = Math.min(W, H) * 0.34;
      const speedMod = s === 'speaking' ? 1.6 : s === 'listening' ? 1.1 : s === 'thinking' ? 0.5 : 0.7;
      const energy = s === 'speaking' ? 1.0 : s === 'listening' ? 0.65 : s === 'thinking' ? 0.3 : 0.25;

      const pts = 64;
      const points = [];
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const n1 = Math.sin(a * 3 + t * 1.2 * speedMod) * 0.35;
        const n2 = Math.sin(a * 5 + t * 0.8 * speedMod + 1.4) * 0.22;
        const n3 = Math.sin(a * 7 + t * 1.6 * speedMod + 2.7) * 0.12;
        const ampNoise = (n1 + n2 + n3) * energy;
        const r = baseR * (1 + ampNoise * 0.45);
        points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.95]);
      }

      function drawBlobPath(scale, color, blur) {
        ctx.save();
        if (blur) ctx.filter = `blur(${blur}px)`;
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < pts; i++) {
          const [x, y] = points[i];
          const sx = cx + (x - cx) * scale;
          const sy = cy + (y - cy) * scale;
          if (i === 0) ctx.moveTo(sx, sy);
          else {
            const [px, py] = points[(i + pts - 1) % pts];
            const xc = (cx + (px - cx) * scale + sx) / 2;
            const yc = (cy + (py - cy) * scale + sy) / 2;
            ctx.quadraticCurveTo(sx, sy, xc, yc);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      drawBlobPath(1.25, __orbMakeGrad(ctx, 0, 0, W, 0, true), 22);
      drawBlobPath(1.05, __orbMakeGrad(ctx, 0, 0, W, 0, true), 8);
      drawBlobPath(1.0, __orbMakeGrad(ctx, 0, 0, W, 0, false), 0);

      // Glass highlight (top-left)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const hl = ctx.createRadialGradient(cx - baseR * 0.4, cy - baseR * 0.4, 0, cx - baseR * 0.4, cy - baseR * 0.4, baseR * 0.8);
      hl.addColorStop(0, 'rgba(255,255,255,0.55)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl;
      drawBlobPath(0.95, hl, 0);
      ctx.restore();
    }

    function draw(now) {
      try {
        const t = (now - t0) / 1000;
        updateTargets(t);
        // Smoother easing — lower factor = silkier transitions
        for (let i = 0; i < bandCount; i++) {
          bands[i] += (targets[i] - bands[i]) * 0.12;
        }
        ctx.clearRect(0, 0, W, H);
        if (variant === 'bars') drawBars(t);
        else if (variant === 'wave') drawWave(t);
        else if (variant === 'blob') drawBlob(t);
      } catch (e) {
        console.error('Orb draw error:', e);
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [W, H, variant]);

  return (
    <div
      ref={wrapRef}
      className={`echo-orb-wrap state-${state}`}
      style={{ width: W, height: H }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: 'block' }}
      />
    </div>
  );
}

window.EchoOrb = Orb;
