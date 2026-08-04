import React from 'react';
import { Box, Stack } from '@mui/material';
import InsectButton from './InsectButton';
import Insect from './Insect';
import Owl from './Owl';
import Hud from './Hud';
import Overlay from './Overlay';
import bg from '../assets/background/bg.png';
import { insectsData } from '../data/insectsData';
import { useGameActions, useGameView } from '../context/gameContext';

const Main: React.FC = () => {
  const { insects, popups, status } = useGameView();
  const { playfieldRef } = useGameActions();

  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 2, pt: '76px' }}>
        <Stack alignItems="center">
          <Hud />
        </Stack>
        <Box sx={{ mt: { xs: 2, sm: 4 } }}>
          <Owl />
        </Box>
      </Box>

      {/*
        The playfield is inset between the HUD and the button bar so insects
        never crawl behind the chrome. It ignores pointer events; only the
        insects inside it are interactive.
      */}
      <Box
        ref={playfieldRef}
        className="playfield"
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '150px',
          bottom: '132px',
          zIndex: 3,
          pointerEvents: 'none',
          '& > *': { pointerEvents: 'auto' },
        }}
      >
        {insects.map((insect) => (
          <Insect
            key={insect.id}
            id={insect.id}
            type={insect.type}
            imgSrc={insect.imgSrc}
            points={insect.points}
          />
        ))}
        {popups.map((popup) => (
          <Box
            key={popup.id}
            className="popup"
            aria-hidden="true"
            sx={{ left: popup.x, top: popup.y }}
          >
            {popup.text}
          </Box>
        ))}
      </Box>

      <Stack
        direction="row"
        spacing={{ xs: 1.5, sm: 3 }}
        justifyContent="center"
        sx={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          zIndex: 4,
        }}
      >
        {insectsData.map((species) => (
          <InsectButton
            key={species.id}
            imgSrc={species.imgSrc}
            name={species.name}
            points={species.points}
            disabled={status !== 'playing'}
          />
        ))}
      </Stack>

      <Overlay />
    </Box>
  );
};

export default Main;
