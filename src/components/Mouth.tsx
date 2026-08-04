import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useGameActions, useGameView } from '../context/gameContext';

/**
 * The owl's mouth.
 *
 * Two nested elements on purpose: the outer box is the hit zone the engine
 * measures with getBoundingClientRect, so it must never be scaled — a closed
 * mouth would otherwise shrink the drop target to nothing. The inner element
 * carries the open/chomp animation.
 */
const Mouth: React.FC = () => {
  const { mouthRef } = useGameActions();
  const { caught } = useGameView();
  const [chomping, setChomping] = useState(false);
  const previousCaught = useRef(caught);

  useEffect(() => {
    if (caught === previousCaught.current) return;
    previousCaught.current = caught;
    setChomping(false);
    // Restart the animation even when two insects are eaten back to back.
    const raf = requestAnimationFrame(() => setChomping(true));
    const timer = window.setTimeout(() => setChomping(false), 450);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [caught]);

  return (
    <Box ref={mouthRef} aria-hidden="true" className="mouth-zone">
      <span className={`mouth-visual${chomping ? ' mouth-visual--chomp' : ''}`} />
    </Box>
  );
};

export default Mouth;
