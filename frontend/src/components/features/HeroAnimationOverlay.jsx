import { useEffect, useRef } from 'react';

function generateHumanShape() {
  const points = [];

  const addEllipse = (cx, cy, rx, ry, density) => {
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      points.push({ x: cx + Math.cos(angle) * rx * r, y: cy + Math.sin(angle) * ry * r });
    }
  };

  const addLine = (x1, y1, x2, y2, thickness, density) => {
    for (let i = 0; i < density; i++) {
      const t = Math.random();
      const lx = x1 + (x2 - x1) * t;
      const ly = y1 + (y2 - y1) * t;
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.sqrt(Math.random()) * thickness;
      points.push({ x: lx + Math.cos(angle) * rad, y: ly + Math.sin(angle) * rad });
    }
  };

  // Head
  addEllipse(0.5, 0.09, 0.045, 0.06, 200);
  // Neck
  addLine(0.5, 0.14, 0.5, 0.17, 0.02, 50);

  // Upper Chest / Shoulders
  addEllipse(0.5, 0.22, 0.12, 0.06, 400);
  // Main Torso
  addEllipse(0.5, 0.35, 0.09, 0.15, 500);
  // Hips
  addEllipse(0.5, 0.48, 0.1, 0.06, 250);

  // Left Arm
  addLine(0.38, 0.22, 0.30, 0.36, 0.025, 180); // upper
  addLine(0.30, 0.36, 0.25, 0.50, 0.02, 120);  // lower
  addEllipse(0.24, 0.53, 0.015, 0.02, 50);     // hand

  // Right Arm
  addLine(0.62, 0.22, 0.70, 0.36, 0.025, 180);
  addLine(0.70, 0.36, 0.75, 0.50, 0.02, 120);
  addEllipse(0.76, 0.53, 0.015, 0.02, 50);

  // Left Leg
  addLine(0.44, 0.5, 0.40, 0.70, 0.035, 200); // thigh
  addLine(0.40, 0.70, 0.40, 0.90, 0.025, 150); // calf
  addLine(0.39, 0.92, 0.35, 0.93, 0.015, 50);  // foot

  // Right Leg
  addLine(0.56, 0.5, 0.60, 0.70, 0.035, 200);
  addLine(0.60, 0.70, 0.60, 0.90, 0.025, 150);
  addLine(0.61, 0.92, 0.65, 0.93, 0.015, 50);

  // A few scattered outer particles to give the "carbon dust" aura
  for (let i = 0; i < 120; i++) {
    points.push({ x: 0.25 + Math.random() * 0.5, y: 0.05 + Math.random() * 0.9 });
  }

  return points;
}
const HUMAN_SHAPE = generateHumanShape();

function drawFootprint(ctx, x, y, angle, isLeft, color, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  const scale = 0.7;
  ctx.scale(scale, scale);

  const dx = isLeft ? -2 : 2;

  // Heel
  ctx.beginPath();
  ctx.ellipse(dx * 1.5, 12, 5, 7, dx * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Sole
  ctx.beginPath();
  ctx.ellipse(dx * 0.5, -2, 7, 10, dx * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Toes
  ctx.beginPath(); ctx.arc(dx * 3, -15, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dx * 8, -13, 2.0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dx * 12, -9, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dx * 15, -4, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dx * -3, -14, 3.5, 0, Math.PI * 2); ctx.fill(); // big toe

  ctx.restore();
}

export default function HeroAnimationOverlay({ phase, earthContainerRef, humanContainerRef }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const footprintsRef = useRef([]);

  const prevEarthXRef = useRef(null);
  const prevEarthYRef = useRef(null);
  const prevHumanXRef = useRef(null);
  const prevHumanYRef = useRef(null);

  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    setTimeout(() => {
      const earth = earthContainerRef?.current;
      const human = humanContainerRef?.current;
      const canvas = canvasRef.current;
      console.log('LAYOUT_STATS:', JSON.stringify({
        earth: earth ? {
          rect: earth.getBoundingClientRect(),
          offsetLeft: earth.offsetLeft,
          offsetTop: earth.offsetTop,
          offsetWidth: earth.offsetWidth,
          offsetHeight: earth.offsetHeight
        } : null,
        human: human ? {
          rect: human.getBoundingClientRect(),
          offsetLeft: human.offsetLeft,
          offsetTop: human.offsetTop,
          offsetWidth: human.offsetWidth,
          offsetHeight: human.offsetHeight
        } : null,
        canvas: canvas ? {
          rect: canvas.getBoundingClientRect(),
          offsetLeft: canvas.offsetLeft,
          offsetTop: canvas.offsetTop,
          offsetWidth: canvas.offsetWidth,
          offsetHeight: canvas.offsetHeight
        } : null
      }));
    }, 2000);
  }, [earthContainerRef, humanContainerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Init particles targeting human shape
    const particles = HUMAN_SHAPE.map((pt, i) => {
      const sizeBase = Math.random();
      // Increase size so they are more prominent and dense, matching the reference image!
      const pSize = sizeBase > 0.85
        ? 3.0 + Math.random() * 2.2  // Large particles (3.0px to 5.2px)
        : 1.2 + Math.random() * 1.8; // Small/Medium particles (1.2px to 3.0px)

      return {
        ptX: pt.x, // normalized ratio
        ptY: pt.y, // normalized ratio
        hx: pt.x * 320, // relative to human box
        hy: pt.y * 480, // relative to human box
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: pSize,
        opacity: 0.7 + Math.random() * 0.3,
        baseOpacity: 0.7 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.04 + Math.random() * 0.03,
        targetInside: null
      };
    });

    let frame = 0;
    let lastPhase = -1;

    // Track previous orbit angle to place footprints
    let lastFootprintAngle = 0;
    let isLeftFoot = true;

    function draw() {
      // Dynamic canvas internal size sync to prevent layout-based stretching
      const targetW = Math.floor(canvas.offsetWidth * window.devicePixelRatio);
      const targetH = Math.floor(canvas.offsetHeight * window.devicePixelRatio);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      frame++;

      const currentPhase = phaseRef.current;
      if (currentPhase !== lastPhase) {
        if (currentPhase === 1) {
          footprintsRef.current = [];
        }
        lastPhase = currentPhase;
      }

      // Center coordinates using offset properties relative to the parent column
      let earthX = canvas.offsetWidth / 2;
      let earthY = canvas.offsetHeight / 2;
      let humanX = 160;
      let humanY = canvas.offsetHeight / 2 - 240;
      const canvasRect = canvas.getBoundingClientRect();

      // Since HeroAnimationOverlay is now perfectly centered inside earthContainerRef
      // and moves with it, its center is always exactly [600, 600].
      // This completely eliminates any getBoundingClientRect calculation bugs on reload!
      earthX = 600;
      earthY = 600;

      if (humanContainerRef?.current) {
        const humanEl = humanContainerRef.current;
        const humanRect = humanEl.getBoundingClientRect();
        humanX = humanRect.left - canvasRect.left;
        humanY = humanRect.top - canvasRect.top;
      }

      if (frame % 60 === 0) {
        console.log('REALTIME_STATS:', JSON.stringify({
          phase: currentPhase,
          earthX,
          earthY,
          earthRect: earthContainerRef?.current ? earthContainerRef.current.getBoundingClientRect() : null,
          canvasRect
        }));
      }

      // Apply coordinates offset shifts directly to particles to eliminate transition lag
      if (typeof prevEarthXRef.current === 'number') {
        const diffX = earthX - prevEarthXRef.current;
        const diffY = earthY - prevEarthYRef.current;
        const diffHX = humanX - prevHumanXRef.current;
        const diffHY = humanY - prevHumanYRef.current;

        particles.forEach(p => {
          if (currentPhase === 1) {
            p.x += diffHX;
            p.y += diffHY;
          } else if (currentPhase === 2 || currentPhase === 0) {
            p.x += diffX;
            p.y += diffY;
          }
        });
      }

      prevEarthXRef.current = earthX;
      prevEarthYRef.current = earthY;
      prevHumanXRef.current = humanX;
      prevHumanYRef.current = humanY;





      // Update & Draw particles
      particles.forEach(p => {
        let tx, ty;

        if (currentPhase === 1) {
          // Phase 1: Form human (Dynamic Horizontal scale)
          p.targetInside = null; // Reset ring target
          if (p.opacity < p.baseOpacity) p.opacity += 0.05;
          const currentHumanWidth = humanContainerRef?.current ? humanContainerRef.current.offsetWidth : 320;
          const currentHumanHeight = humanContainerRef?.current ? humanContainerRef.current.offsetHeight : 480;
          tx = humanX + p.ptX * currentHumanWidth;
          ty = humanY + p.ptY * currentHumanHeight;
          const dx = tx - p.x;
          const dy = ty - p.y;
          p.x += dx * p.speed + Math.sin(frame * 0.03 + p.phase) * 0.4;
          p.y += dy * p.speed + Math.cos(frame * 0.03 + p.phase) * 0.3;
        }
        else if (currentPhase === 2 || currentPhase === 0) {
          // Phase 2 & 0: Flow smoothly and orbit in the dense circular ring
          if (!p.targetInside) {
            const r = 155 + Math.random() * 10; // Concentric ring flush with earth edge (~157px)
            const theta = Math.random() * Math.PI * 2;
            p.targetInside = {
              angle: theta,
              radius: r,
              // Unified rotation direction for a smooth asteroid belt flow
              speed: 0.005 + Math.random() * 0.005
            };
          }
          // Orbit angle rotates continuously to prevent start-rotation jumpiness
          p.targetInside.angle += p.targetInside.speed;

          // Dynamically scale orbit radius to match resized Earth canvas
          const containerSize = earthContainerRef?.current?.offsetHeight || 800;
          const scaleFactor = containerSize / 800;

          tx = earthX + Math.cos(p.targetInside.angle) * (p.targetInside.radius * scaleFactor);
          ty = earthY + Math.sin(p.targetInside.angle) * (p.targetInside.radius * scaleFactor);

          // Easing is constant (0.05) to eliminate any speed-change cut or jerks
          p.x += (tx - p.x) * 0.05;
          p.y += (ty - p.y) * 0.05;
        }
        else if (currentPhase === 3) {
          // Phase 3: Quick fade out and prep for reset loop
          p.opacity -= 0.05;
          if (p.opacity < 0) p.opacity = 0;
          p.x += Math.sin(p.phase) * 2;
          p.y += Math.cos(p.phase) * 2;
        }

        // Draw beautifully detailed Green Leaf
        ctx.save();
        ctx.globalAlpha = p.opacity;

        // Calculate angle based on motion flow
        const leafAngle = (currentPhase === 2 || currentPhase === 0) && p.targetInside
          ? p.targetInside.angle + Math.PI / 2
          : p.phase + frame * 0.02;

        ctx.translate(p.x, p.y);
        ctx.rotate(leafAngle);

        const leafSize = p.size * 2.5; // Scale up slightly to see details clearly

        // Draw leaf body
        ctx.beginPath();
        ctx.moveTo(0, leafSize);
        ctx.quadraticCurveTo(-leafSize * 0.68, 0, 0, -leafSize);
        ctx.quadraticCurveTo(leafSize * 0.68, 0, 0, leafSize);
        ctx.closePath();

        // Premium linear gradient representing light/depth
        const leafGrad = ctx.createLinearGradient(0, leafSize, 0, -leafSize);
        leafGrad.addColorStop(0, '#047857');   // Shadow green
        leafGrad.addColorStop(0.5, '#10b981'); // Vibrant emerald
        leafGrad.addColorStop(1, '#6ee7b7');   // Fresh mint highlight

        ctx.fillStyle = leafGrad;
        ctx.fill();

        // Draw leaf central vein detailing
        ctx.beginPath();
        ctx.moveTo(0, leafSize * 0.85);
        ctx.lineTo(0, -leafSize * 0.55);
        ctx.strokeStyle = '#a7f3d0'; // Light mint vein line
        ctx.lineWidth = Math.max(0.7, leafSize * 0.15);
        ctx.stroke();

        ctx.restore();
      });



      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <div style={{ position: 'absolute', top: 'calc(50% - 600px)', left: 'calc(50% - 600px)', width: '1200px', height: '1200px', pointerEvents: 'none', zIndex: 30 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
