import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useGameActions } from '../context/gameContext';
import type { InsectType } from '../game/types';

interface InsectButtonProps {
  imgSrc: string;
  name: InsectType;
  points: number;
  disabled?: boolean;
}

/**
 * Spawns an extra insect on demand — more points on the board, but also more
 * that can escape and cost a life.
 */
const InsectButton: React.FC<InsectButtonProps> = ({ imgSrc, name, points, disabled }) => {
  const { addInsect } = useGameActions();

  return (
    <Button
      size="large"
      disabled={disabled}
      onClick={() => addInsect(name)}
      aria-label={`Release ${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name} worth ${points} points`}
      sx={{
        bgcolor: 'secondary.main',
        borderRadius: '14px',
        minWidth: 0,
        px: { xs: 1.5, sm: 2.5 },
        py: 1,
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
        '&:hover': { bgcolor: 'white' },
        '&.Mui-disabled': { bgcolor: 'rgba(244, 244, 242, 0.35)' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <img src={imgSrc} alt="" className="button-image" />
        <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{name}</Typography>
        <Typography sx={{ fontSize: 11, opacity: 0.65, lineHeight: 1 }}>+{points}</Typography>
      </Box>
    </Button>
  );
};

export default InsectButton;
