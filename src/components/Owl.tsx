import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

import OwlImage from '../assets/owl/Owl.png';
import Lefteye from '../assets/owl/lefteye.png';
import Righteye from '../assets/owl/righteye.png';

import Mouth from './Mouth';
import { useGameView } from '../context/gameContext';

/** How far a pupil can slide from its resting position. */
const EYE_TRAVEL = 14;

const Owl: React.FC = () => {
  const faceRef = useRef<HTMLDivElement | null>(null);
  const { caught } = useGameView();
  const [swallowing, setSwallowing] = useState(false);
  const previousCaught = useRef(caught);
  const leftEyeRef = useRef<HTMLImageElement | null>(null);
  const rightEyeRef = useRef<HTMLImageElement | null>(null);

  /**
   * Eye tracking runs entirely on refs and rAF. Routing pointer moves through
   * React state would re-render every insect dozens of times per second.
   */
  useEffect(() => {
    const pointer = { x: 0, y: 0 };
    let hasPointer = false;
    let dirty = false;
    let frame = 0;

    // Cached so the animation frame never reads layout it just wrote.
    let anchors: Array<{ el: HTMLElement; x: number; y: number }> = [];

    const remeasure = () => {
      const face = faceRef.current;
      if (!face) return;
      const rect = face.getBoundingClientRect();
      anchors = [leftEyeRef.current, rightEyeRef.current]
        .filter((el): el is HTMLImageElement => el !== null)
        .map((el) => ({
          el,
          // offsetLeft/Top ignore transforms, so this stays the resting centre.
          x: rect.left + el.offsetLeft + el.offsetWidth / 2,
          y: rect.top + el.offsetTop + el.offsetHeight / 2,
        }));
      dirty = true;
    };

    const render = () => {
      frame = requestAnimationFrame(render);
      if (!dirty || !hasPointer) return;
      dirty = false;

      for (const anchor of anchors) {
        const dx = pointer.x - anchor.x;
        const dy = pointer.y - anchor.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 1) {
          anchor.el.style.transform = 'translate3d(0, 0, 0)';
          continue;
        }
        const travel = Math.min(EYE_TRAVEL, distance);
        anchor.el.style.transform =
          `translate3d(${(dx / distance) * travel}px, ${(dy / distance) * travel}px, 0)`;
      }
    };

    const handleMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      hasPointer = true;
      dirty = true;
    };

    remeasure();
    frame = requestAnimationFrame(render);
    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, { passive: true });

    // The face has no size until the sprites decode, so re-anchor when it grows.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(remeasure);
    if (observer && faceRef.current) observer.observe(faceRef.current);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure);
    };
  }, []);

  // A little head bob whenever something goes down the hatch.
  useEffect(() => {
    if (caught === previousCaught.current) return;
    previousCaught.current = caught;
    setSwallowing(false);
    const raf = requestAnimationFrame(() => setSwallowing(true));
    const timer = window.setTimeout(() => setSwallowing(false), 460);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [caught]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box
        ref={faceRef}
        className={swallowing ? 'owl-face owl-face--swallow' : 'owl-face'}
        sx={{ position: 'relative', lineHeight: 0 }}
      >
        <img src={OwlImage} className="main-image" alt="An owl waiting to be fed" />
        <img src={Lefteye} ref={leftEyeRef} className="eye-image eye-left" alt="" />
        <img src={Righteye} ref={rightEyeRef} className="eye-image eye-right" alt="" />
        <Mouth />
      </Box>
    </Box>
  );
};

export default Owl;
