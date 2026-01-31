import React, { useEffect, useState, useRef } from 'react';

const NetworkBackground = () => {
    const canvasRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', updateDimensions);
        window.addEventListener('mousemove', handleMouseMove);

        updateDimensions();

        return () => {
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Configuration
        const particleCount = 80;
        const connectionDistance = 140;
        const mouseDistance = 250;

        // Colors & Glows
        const nodeColor = '#06b6d4'; // Cyan-500
        const lineColor = 'rgba(56, 189, 248, 0.2)'; // Sky-400
        const mouseLineColor = 'rgba(34, 211, 238, 0.8)'; // Cyan-400

        // Initialize particles (Human Figures)
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * dimensions.width,
                y: Math.random() * dimensions.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                size: Math.random() * 0.5 + 0.8, // Scale for the icon
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        // Data Packets
        const packets = [];
        const packetSpawnRate = 0.1;

        // Helper to draw a human figure (Head + Shoulders)
        const drawHuman = (ctx, x, y, scale, color, glow) => {
            ctx.fillStyle = color;
            ctx.shadowBlur = glow;
            ctx.shadowColor = color;

            // Head
            ctx.beginPath();
            ctx.arc(x, y - 5 * scale, 3 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Body (Shoulders)
            ctx.beginPath();
            ctx.arc(x, y + 2 * scale, 5 * scale, Math.PI, 0); // Half circle up
            ctx.fill();

            ctx.shadowBlur = 0;
        };

        const render = () => {
            if (!ctx) return;

            ctx.fillStyle = 'rgba(2, 6, 23, 0.3)'; // Trail effect
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);

            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            const time = Date.now() / 1000;

            // Update particles
            particles.forEach((p, idx) => {
                p.x += p.vx;
                p.y += p.vy;

                // Mouse influence
                const dx = mx - p.x;
                const dy = my - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouseDistance) {
                    const force = (mouseDistance - dist) / mouseDistance;
                    p.vx += (dx / dist) * force * 0.05;
                    p.vy += (dy / dist) * force * 0.05;
                }

                // Bounce
                if (p.x < 0 || p.x > dimensions.width) p.vx *= -1;
                if (p.y < 0 || p.y > dimensions.height) p.vy *= -1;

                // Draw Human Figure
                const pulse = Math.sin(time * 3 + p.pulseOffset) * 0.5 + 1; // 0.5 to 1.5
                drawHuman(ctx, p.x, p.y, p.size * pulse, nodeColor, 10);

                // Connect to Mouse
                if (dist < mouseDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = mouseLineColor;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mx, my);
                    ctx.stroke();
                }
            });

            // Connections & Packets
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = lineColor;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();

                        if (Math.random() < packetSpawnRate && packets.length < 40) {
                            packets.push({
                                x: p1.x,
                                y: p1.y,
                                targetX: p2.x,
                                targetY: p2.y,
                                progress: 0,
                                speed: 0.03 + Math.random() * 0.02,
                                color: '#a855f7'
                            });
                        }
                    }
                }
            }

            // Draw Packets
            for (let i = packets.length - 1; i >= 0; i--) {
                const pkt = packets[i];
                pkt.progress += pkt.speed;
                if (pkt.progress >= 1) {
                    packets.splice(i, 1);
                    continue;
                }

                const currX = pkt.x + (pkt.targetX - pkt.x) * pkt.progress;
                const currY = pkt.y + (pkt.targetY - pkt.y) * pkt.progress;

                ctx.beginPath();
                ctx.fillStyle = pkt.color;
                ctx.shadowBlur = 5;
                ctx.shadowColor = pkt.color;
                ctx.arc(currX, currY, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [dimensions]);

    return (
        <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 bg-[#020617]"
        />
    );
};

export default NetworkBackground;
