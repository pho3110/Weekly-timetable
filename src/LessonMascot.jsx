import { useEffect, useRef, useState } from 'react';

export function LessonMascot() {
  const container = useRef(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let disposed = false;
    let animation;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function updatePlayback() {
      if (!animation) return;
      if (motion.matches) animation.goToAndStop(0, true);
      else if (document.hidden) animation.pause();
      else animation.play();
    }
    Promise.all([
      import('lottie-web/build/player/lottie_light'),
      import('./assets/cat-crying.json'),
    ]).then(([player, data]) => {
      if (disposed) return;
      animation = player.default.loadAnimation({
        container: container.current, renderer: 'svg', loop: true, autoplay: false,
        animationData: JSON.parse(JSON.stringify(data.default)),
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
      });
      animation.addEventListener('DOMLoaded', () => { setReady(true); updatePlayback(); });
      animation.addEventListener('error', () => setReady(false));
    }).catch(() => { /* The static emoji remains if animation loading fails. */ });
    motion.addEventListener('change', updatePlayback);
    document.addEventListener('visibilitychange', updatePlayback);
    return () => {
      disposed = true;
      motion.removeEventListener('change', updatePlayback);
      document.removeEventListener('visibilitychange', updatePlayback);
      animation?.destroy();
      setReady(false);
    };
  }, [visible]);

  return <span ref={container} className={`lesson-mascot${ready ? ' is-ready' : ''}`} aria-hidden="true"><span className="mascot-fallback">😿</span></span>;
}
