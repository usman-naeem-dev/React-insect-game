import React, { memo, useCallback, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useGameActions } from '../context/gameContext';
import { INSECT_SIZE } from '../game/constants';
import type { InsectType } from '../game/types';

interface InsectProps {
  id: number;
  type: InsectType;
  imgSrc: string;
  points: number;
}

/** Pointer travel (px) past which a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 6;

const Insect: React.FC<InsectProps> = ({ id, type, imgSrc, points }) => {
  const { registerInsect, grab, dragTo, release, feed, isOverMouth, mouthRef } = useGameActions();
  const [dragging, setDragging] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  const setNode = useCallback(
    (node: HTMLDivElement | null) => registerInsect(id, node),
    [id, registerInsect],
  );

  const highlightMouth = useCallback(
    (hot: boolean) => mouthRef.current?.classList.toggle('mouth-zone--hot', hot),
    [mouthRef],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    try {
      // Throws if the pointer is already released — harmless, keep dragging.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* no capture: pointermove still lands while the pointer is over the insect */
    }
    origin.current = { x: event.clientX, y: event.clientY };
    moved.current = false;
    grab(id, event.clientX, event.clientY);
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    if (
      !moved.current &&
      Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) >
        DRAG_THRESHOLD
    ) {
      moved.current = true;
    }
    dragTo(id, event.clientX, event.clientY);
    if (moved.current) highlightMouth(isOverMouth(event.clientX, event.clientY));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    origin.current = null;
    setDragging(false);
    highlightMouth(false);

    const wasDrag = moved.current;
    const fed = release(id, event.clientX, event.clientY);
    // A press that never moved is a tap: send the insect to the mouth instead.
    if (!fed && !wasDrag) feed(id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      feed(id);
    }
  };

  return (
    <Box
      ref={setNode}
      role="button"
      tabIndex={0}
      aria-label={`Feed ${type} to the owl for ${points} points`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className="insect"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: INSECT_SIZE,
        height: INSECT_SIZE,
        // Without this, touch-dragging scrolls the page instead of moving the insect.
        touchAction: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
        opacity: dragging ? 0.85 : 1,
        zIndex: dragging ? 5 : 2,
        willChange: 'transform',
      }}
    >
      <img src={imgSrc} alt="" draggable={false} className="insect-image" />
    </Box>
  );
};

export default memo(Insect);
