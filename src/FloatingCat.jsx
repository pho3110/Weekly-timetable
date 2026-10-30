import { useEffect, useRef, useState } from 'react';
import { Cat, Info, Minus } from 'lucide-react';
import { Rive, RuntimeLoader, Layout, Fit, Alignment } from '@rive-app/canvas-lite';
import wasmUrl from '@rive-app/canvas-lite/rive.wasm?url';
import catUrl from './assets/interactive-cat.riv?url';

RuntimeLoader.setWasmUrl(wasmUrl);
RuntimeLoader.setWasmFallbackUrl(null);

const WIDTH = 144;
const HEIGHT = 174;
function clampPosition(x, y) {
  const style = getComputedStyle(document.documentElement);
  const left = Math.max(12, parseFloat(style.getPropertyValue('--safe-left')) || 0);
  const right = Math.max(12, parseFloat(style.getPropertyValue('--safe-right')) || 0);
  const top = Math.max(12, parseFloat(style.getPropertyValue('--safe-top')) || 0);
  const bottom = Math.max(34, parseFloat(style.getPropertyValue('--safe-bottom')) || 0);
  return { x: Math.max(left, Math.min(x, window.innerWidth - WIDTH - right)), y: Math.max(top, Math.min(y, window.innerHeight - HEIGHT - bottom)) };
}

export default function FloatingCat({ hidden }) {
  const canvas = useRef(null);
  const body = useRef(null);
  const drag = useRef(null);
  const [position, setPosition] = useState(() => clampPosition(window.innerWidth - WIDTH - 16, window.innerHeight - HEIGHT - 34));
  const [minimized, setMinimized] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    const resize = () => setPosition(current => clampPosition(current.x, current.y));
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (minimized || hidden) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let pauseTimer;
    const cat = new Rive({
      src: catUrl, canvas: canvas.current, stateMachine: 'State Machine 1',
      autoplay: true, layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      onLoad: () => {
        if (disposed) return;
        cat.resizeDrawingSurfaceToCanvas(Math.min(window.devicePixelRatio || 1, 2));
        setFailed(false);
        setReady(true);
        lookAt(window.innerWidth / 2, window.innerHeight / 2);
        if (motion.matches || document.hidden) pauseTimer = window.setTimeout(() => cat.pause(), 80);
      },
      onLoadError: () => { if (!disposed) setFailed(true); },
    });
    function playback() {
      if (motion.matches || document.hidden) cat.pause();
      else cat.play();
    }
    motion.addEventListener('change', playback);
    document.addEventListener('visibilitychange', playback);
    return () => {
      disposed = true;
      clearTimeout(pauseTimer);
      motion.removeEventListener('change', playback);
      document.removeEventListener('visibilitychange', playback);
      cat.cleanup(); setReady(false);
    };
  }, [minimized, hidden]);

  function lookAt(x, y) {
    if (!body.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = body.current.getBoundingClientRect();
    // This artwork uses Rive pointer listeners, not numeric state inputs.
    // Project screen touches into its hit area so it also follows taps outside
    // the small floating canvas on a phone.
    const clientX = rect.left + Math.max(0, Math.min(1, x / window.innerWidth)) * rect.width;
    const clientY = rect.top + Math.max(0, Math.min(1, y / window.innerHeight)) * rect.height;
    canvas.current?.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }));
  }
  const lookRef = useRef(lookAt);
  lookRef.current = lookAt;
  useEffect(() => {
    if (minimized || hidden) return;
    const follow = event => lookRef.current(event.clientX, event.clientY);
    window.addEventListener('pointermove', follow, { passive: true });
    window.addEventListener('pointerdown', follow, { passive: true });
    return () => { window.removeEventListener('pointermove', follow); window.removeEventListener('pointerdown', follow); };
  }, [minimized, hidden]);

  if (hidden) return null;
  if (minimized) return <button className="pet-restore" aria-label="Hiện mèo tương tác" onClick={() => { setFailed(false); setMinimized(false); }}><Cat size={22}/></button>;
  return <aside className="floating-cat" style={{ left: position.x, top: position.y }} aria-label="Mèo tương tác">
    <div className="pet-controls"><details className="pet-credit"><summary aria-label="Thông tin linh vật"><Info size={16}/></summary><p><a href="https://rive.app/marketplace/3920-8202-cat-following-the-mouse/" target="_blank" rel="noreferrer">Cat following the mouse</a><br/>Tác giả: pedroalpera · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY</a></p></details><button aria-label="Thu gọn mèo" onClick={() => setMinimized(true)}><Minus size={17}/></button></div>
    <div ref={body} className="pet-body" role="button" tabIndex={0} aria-label="Mèo nhìn theo bạn. Kéo để di chuyển; dùng phím mũi tên để đổi vị trí."
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: positionRef.current };
      }}
      onPointerMove={event => {
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) setPosition(clampPosition(start.origin.x + event.clientX - start.x, start.origin.y + event.clientY - start.y));
      }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
      onKeyDown={event => {
        const delta = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
        if (delta) { event.preventDefault(); setPosition(p => clampPosition(p.x + delta[0], p.y + delta[1])); }
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); lookAt(position.x + WIDTH / 2, position.y); }
      }}>
      <canvas ref={canvas} aria-hidden="true"/>{(!ready || failed) && <span className="pet-placeholder" aria-hidden="true">🐈</span>}
    </div>
  </aside>;
}
