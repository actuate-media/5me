'use client';

import { useEffect, useRef } from 'react';

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mouseX = -1000;
    let mouseY = -1000;
    const HOVER_RADIUS = 120;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const STAR_COUNT = 220;

    interface Star {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      radius: number;
      baseRadius: number;
      opacity: number;
      twinkleSpeed: number;
      twinkleDirection: 1 | -1;
      driftAngle: number;
      driftSpeed: number;
      driftRange: number;
      driftOffset: number;
    }

    const stars: Star[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 7.2 + 2.4;
      stars.push({
        x,
        y,
        baseX: x,
        baseY: y,
        radius,
        baseRadius: radius,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.008 + 0.002,
        twinkleDirection: Math.random() > 0.5 ? 1 : -1,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.003 + 0.001,
        driftRange: Math.random() * 12 + 4,
        driftOffset: Math.random() * Math.PI * 2,
      });
    }

    const drawStar = (
      centerX: number,
      centerY: number,
      outerRadius: number,
      innerRadius: number,
      points: number
    ) => {
      let angle = -Math.PI / 2;
      const step = Math.PI / points;

      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const outerX = centerX + Math.cos(angle) * outerRadius;
        const outerY = centerY + Math.sin(angle) * outerRadius;
        ctx.lineTo(outerX, outerY);
        angle += step;

        const innerX = centerX + Math.cos(angle) * innerRadius;
        const innerY = centerY + Math.sin(angle) * innerRadius;
        ctx.lineTo(innerX, innerY);
        angle += step;
      }
      ctx.closePath();
      ctx.fill();
    };

    let time = 0;

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      stars.forEach((star) => {
        // Gentle floating drift
        const driftX = Math.sin(time * star.driftSpeed + star.driftOffset) * star.driftRange;
        const driftY = Math.cos(time * star.driftSpeed * 0.7 + star.driftOffset) * star.driftRange;
        star.x = star.baseX + driftX;
        star.y = star.baseY + driftY;

        // Hover interaction: push stars away and brighten them
        const dx = star.x - mouseX;
        const dy = star.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let renderX = star.x;
        let renderY = star.y;
        let renderRadius = star.baseRadius;
        let extraOpacity = 0;

        if (dist < HOVER_RADIUS) {
          const force = (1 - dist / HOVER_RADIUS) * 30;
          const angle = Math.atan2(dy, dx);
          renderX += Math.cos(angle) * force;
          renderY += Math.sin(angle) * force;
          renderRadius = star.baseRadius * (1 + (1 - dist / HOVER_RADIUS) * 0.6);
          extraOpacity = (1 - dist / HOVER_RADIUS) * 0.35;
        }

        // Twinkle
        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity >= 0.85) star.twinkleDirection = -1;
        if (star.opacity <= 0.15) star.twinkleDirection = 1;

        const finalOpacity = Math.min(1, star.opacity + extraOpacity);

        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        drawStar(renderX, renderY, renderRadius, renderRadius * 0.45, 5);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
