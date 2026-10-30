"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { FRAME, LAYERS, pct } from "./hero-layout";

const CHARACTERS = [
  { name: "lucas", ...LAYERS.lucas },
  { name: "tux", ...LAYERS.tux },
  { name: "tabby", ...LAYERS.tabby },
] as const;

const isReduced = () => document.documentElement.dataset.motion === "reduced";

/** Layered pixel-art hero scene with pointer/scroll parallax driven by --px / --py. */
export function HeroScene() {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let frame = 0;
    const setVars = (px: number, py: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        scene.style.setProperty("--px", px.toFixed(3));
        scene.style.setProperty("--py", py.toFixed(3));
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isReduced()) return setVars(0, 0);
      setVars((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };

    const onScroll = () => {
      if (isReduced()) return setVars(0, 0);
      setVars(0, Math.min(window.scrollY / scene.offsetHeight, 1));
    };

    const canHover = window.matchMedia("(hover: hover)").matches;
    if (canHover) window.addEventListener("pointermove", onPointerMove);
    else window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className="t-scene"
      ref={sceneRef}
      role="img"
      aria-label="Ilustração em pixel art: Lucas com suas duas gatas num terraço sobre uma cidade neon à noite"
    >
      <div className="t-scene__frame">
        <div className="t-scene__bg">
          <Image src="/hero/bg.webp" alt="" width={FRAME.w} height={FRAME.h} unoptimized loading="eager" fetchPriority="high" />
        </div>
        <div className="t-scene__chars">
          <Image src="/hero/shadows.webp" alt="" width={FRAME.w} height={FRAME.h} unoptimized loading="eager" className="t-scene__shadows" />
          {CHARACTERS.map((c) => (
            <Image
              key={c.name}
              src={`/hero/${c.name}.webp`}
              alt=""
              width={c.w}
              height={c.h}
              unoptimized
              loading="eager"
              className={`t-scene__char t-scene__char--${c.name}`}
              style={{
                left: pct(c.x, FRAME.w),
                top: pct(c.y, FRAME.h),
                width: pct(c.w, FRAME.w),
                height: pct(c.h, FRAME.h),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
