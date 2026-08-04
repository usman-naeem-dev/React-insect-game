import React from 'react';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { useGameActions, useGameView } from '../context/gameContext';

const Navbar: React.FC = () => {
  const { status } = useGameView();
  const { start } = useGameActions();

  return (
    <AppBar
      position="fixed"
      sx={{ bgcolor: 'secondary.main', color: 'primary.main', boxShadow: 'none' }}
    >
      <Container>
        <Toolbar sx={{ padding: 0, minHeight: 64 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              component="h1"
              variant="h5"
              sx={{ fontWeight: 700, letterSpacing: '0.2rem', fontSize: { xs: 16, sm: 20 } }}
            >
              FEED THE OWL
            </Typography>
          </Box>
          {status === 'playing' && (
            <Button color="inherit" onClick={start} sx={{ fontWeight: 700 }}>
              Restart
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
