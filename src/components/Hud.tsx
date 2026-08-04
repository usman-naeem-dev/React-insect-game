import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useGameView } from '../context/gameContext';
import { MAX_MULTIPLIER, STARTING_LIVES, multiplierFor } from '../game/constants';

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ textAlign: 'center', minWidth: 84 }}>
    <Typography
      variant="caption"
      sx={{ display: 'block', letterSpacing: '0.14em', opacity: 0.7, fontSize: 11 }}
    >
      {label}
    </Typography>
    <Typography component="div" sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1.15 }}>
      {value}
    </Typography>
  </Box>
);

const Hud: React.FC = () => {
  const { score, lives, combo, highScore } = useGameView();
  const multiplier = multiplierFor(combo);

  return (
    <Box
      className="hud"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 1.5, sm: 3 },
        px: 3,
        py: 1.25,
        borderRadius: '999px',
        color: 'secondary.main',
      }}
    >
      <Stat label="SCORE" value={score.toLocaleString()} />
      <Stat label="BEST" value={highScore.toLocaleString()} />
      <Stat
        label="LIVES"
        value={
          <>
            <Stack direction="row" spacing={0.5} justifyContent="center" aria-hidden="true">
              {Array.from({ length: STARTING_LIVES }, (_, i) => (
                <Box key={i} className={`life${i < lives ? '' : ' life--lost'}`} />
              ))}
            </Stack>
            <Box component="span" className="sr-only">{`${lives} of ${STARTING_LIVES}`}</Box>
          </>
        }
      />
      <Stat
        label="COMBO"
        value={
          <Box
            component="span"
            className={multiplier > 1 ? 'multiplier multiplier--hot' : 'multiplier'}
          >
            {multiplier}
            {multiplier === MAX_MULTIPLIER ? '× MAX' : '×'}
          </Box>
        }
      />
    </Box>
  );
};

export default Hud;
