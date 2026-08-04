import React, { useEffect, useRef } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useGameActions, useGameView } from '../context/gameContext';
import { insectsData } from '../data/insectsData';

const HowToPlay: React.FC = () => (
  <Stack spacing={1.25} sx={{ mt: 2.5, mb: 3, alignItems: 'center' }}>
    <Typography sx={{ opacity: 0.85, maxWidth: 380 }}>
      Insects crawl in from the edges. Drag one into the owl&apos;s mouth — or just tap it — before
      it gets away. Three escapes and the run is over.
    </Typography>
    <Stack direction="row" spacing={2.5} sx={{ pt: 0.5 }}>
      {insectsData.map((species) => (
        <Stack key={species.id} alignItems="center" spacing={0.25}>
          <img src={species.imgSrc} alt="" className="button-image" />
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{species.points}</Typography>
        </Stack>
      ))}
    </Stack>
    <Typography sx={{ opacity: 0.6, fontSize: 13 }}>
      Every 5 catches in a row raises your multiplier.
    </Typography>
  </Stack>
);

const Overlay: React.FC = () => {
  const { status, score, highScore, caught, bestCombo } = useGameView();
  const { start } = useGameActions();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (status !== 'playing') buttonRef.current?.focus();
  }, [status]);

  if (status === 'playing') return null;

  const isGameOver = status === 'over';
  const isNewBest = isGameOver && score > 0 && score >= highScore;

  return (
    <Box
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isGameOver ? 'Game over' : 'Start game'}
    >
      <Box className="overlay__panel">
        <Typography
          variant="h3"
          sx={{ fontWeight: 900, letterSpacing: '0.02em', fontSize: { xs: 34, sm: 44 } }}
        >
          {isGameOver ? 'Game Over' : 'Feed the Owl'}
        </Typography>

        {isGameOver ? (
          <Stack spacing={0.75} sx={{ mt: 2, mb: 3 }} aria-live="polite">
            {isNewBest && (
              <Typography sx={{ fontWeight: 800, color: '#ffd166' }}>New best score!</Typography>
            )}
            <Typography sx={{ fontSize: 20 }}>
              You scored <strong>{score.toLocaleString()}</strong>
            </Typography>
            <Typography sx={{ opacity: 0.75, fontSize: 15 }}>
              {caught} caught · best streak {bestCombo} · all-time best {highScore.toLocaleString()}
            </Typography>
          </Stack>
        ) : (
          <HowToPlay />
        )}

        <Button
          ref={buttonRef}
          onClick={start}
          variant="contained"
          size="large"
          sx={{
            bgcolor: 'secondary.main',
            color: 'primary.main',
            fontWeight: 800,
            px: 5,
            py: 1.25,
            borderRadius: '999px',
            '&:hover': { bgcolor: '#fff' },
          }}
        >
          {isGameOver ? 'Play Again' : 'Start Game'}
        </Button>
      </Box>
    </Box>
  );
};

export default Overlay;
