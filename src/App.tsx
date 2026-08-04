import React, { Suspense, lazy } from 'react';
import Context from './context/Context';
import Loader from './components/Loader';
import Navbar from './components/Navbar';

// Code-split the playfield: it pulls in the game engine and every sprite.
const Main = lazy(() => import('./components/Main'));

const App = () => (
  <Context>
    <Navbar />
    <Suspense fallback={<Loader />}>
      <Main />
    </Suspense>
  </Context>
);

export default App;
