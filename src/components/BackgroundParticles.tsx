"use client";

import React, { useEffect, useRef } from "react";

export default function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = 0.5 + Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.speedY = -0.1 - Math.random() * 0.25; // Drift upwards slowly
        this.opacity = 0.1 + Math.random() * 0.45;
        this.fadeSpeed = 0.001 + Math.random() * 0.003;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Reset if they move off screen
        if (this.y < 0) {
          this.y = height;
          this.x = Math.random() * width;
        }
        if (this.x < 0 || this.x > width) {
          this.x = Math.random() * width;
        }
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        // Crimson red/pink particles matching Netflix aesthetic
        context.fillStyle = `rgba(229, 9, 20, ${this.opacity})`;
        context.shadowBlur = this.size * 3;
        context.shadowColor = "rgba(229, 9, 20, 0.5)";
        context.fill();
      }
    }

    const particlesArray: Particle[] = [];
    const count = Math.min(60, Math.floor((width * height) / 25000)); // Cap particles based on screen area

    for (let i = 0; i < count; i++) {
      particlesArray.push(new Particle());
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.shadowColor = "transparent"; // Reset shadow for efficiency
      ctx.shadowBlur = 0;

      particlesArray.forEach((particle) => {
        particle.update();
        particle.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
