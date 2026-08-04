import React from 'react';

/**
 * Self-contained CSS spinner — no external asset, so it can't be blocked,
 * rate-limited or slowed down by a third-party host.
 */
const Loader: React.FC = () => (
  <div className="loader" role="status" aria-live="polite">
    <div className="loader__ring" aria-hidden="true" />
    <span className="sr-only">Loading the game</span>
  </div>
);

export default Loader;
