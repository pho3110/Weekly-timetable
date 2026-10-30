// The HTML shell appears before React. Load the local Lottie player separately
// so animation code never blocks mounting or reading the saved schedule.
export function dismissStartup() {
  const splash = document.getElementById('startup');
  const root = document.getElementById('root');
  const container = document.getElementById('startup-animation');
  if (!splash || !root || !container) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation;
  let closed = false;
  let removalTimer;
  let safetyTimer;
  const destroy = () => { animation?.destroy(); splash.remove(); };
  function reveal() {
    if (closed) return;
    closed = true;
    window.clearTimeout(safetyTimer);
    root.inert = false;
    root.removeAttribute('aria-busy');
    if (motion.matches) { destroy(); return; }
    splash.classList.add('is-leaving');
    removalTimer = window.setTimeout(destroy, 260);
  }
  const handleMotion = () => { if (motion.matches) reveal(); };
  motion.addEventListener('change', handleMotion);
  if (motion.matches) reveal();
  else {
    // An unavailable asset or player must never trap the user on the splash.
    safetyTimer = window.setTimeout(reveal, 2500);
    Promise.all([
      import('lottie-web/build/player/lottie_light'),
      import('./assets/totoro-walk.json'),
    ]).then(([player, data]) => {
      if (closed) return;
      animation = player.default.loadAnimation({
        container, renderer: 'svg', loop: false, autoplay: false,
        animationData: data.default,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: false },
      });
      animation.addEventListener('DOMLoaded', () => {
        if (closed) return;
        animation.goToAndStop(0, true);
        splash.classList.add('has-animation');
        animation.play();
      });
      animation.addEventListener('complete', reveal);
      animation.addEventListener('data_failed', reveal);
      animation.addEventListener('error', reveal);
    }).catch(reveal);
  }
  return () => {
    closed = true;
    window.clearTimeout(safetyTimer);
    window.clearTimeout(removalTimer);
    motion.removeEventListener('change', handleMotion);
    animation?.destroy();
  };
}
