import { useLayoutEffect, useRef, useState } from 'react';
import { DAYS } from './storage';

export function DayPager({ day, children, ...swipeHandlers }) {
  const viewport = useRef(null);
  const incoming = useRef(null);
  const outgoing = useRef(null);
  const previousDay = useRef(day);
  const [transition, setTransition] = useState(null);

  useLayoutEffect(() => {
    const from = previousDay.current;
    previousDay.current = day;
    if (from === day) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !viewport.current?.getClientRects().length) {
      setTransition(null);
      return;
    }
    setTransition({ from, to: day });
  }, [day]);

  useLayoutEffect(() => {
    if (!transition || !incoming.current || !outgoing.current) return;
    const direction = Math.sign(transition.to - transition.from);
    const distance = viewport.current.clientWidth + 12;
    const style = getComputedStyle(viewport.current);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const options = { duration: 300, easing: 'cubic-bezier(.22,.75,.2,1)' };
    const animations = [
      incoming.current.animate([
        { transform: `translateX(${direction * distance}px)` },
        { transform: 'translateX(0)' },
      ], options),
      outgoing.current.animate([
        { transform: 'translateX(0)' },
        { transform: `translateX(${-direction * distance}px)` },
      ], options),
      viewport.current.animate([
        { height: `${outgoing.current.offsetHeight + padding}px` },
        { height: `${incoming.current.offsetHeight + padding}px` },
      ], options),
    ];
    let cancelled = false;
    const finish = () => { if (!cancelled) setTransition(null); };
    Promise.all(animations.map(animation => animation.finished)).then(finish).catch(() => {});
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduceMotion = () => { if (motion.matches) finish(); };
    motion.addEventListener('change', reduceMotion);
    window.addEventListener('resize', finish);
    return () => {
      cancelled = true;
      animations.forEach(animation => animation.cancel());
      motion.removeEventListener('change', reduceMotion);
      window.removeEventListener('resize', finish);
    };
  }, [transition]);

  return <div ref={viewport} className="day-pager" role="group" aria-label={DAYS[day]} {...swipeHandlers}>
    {transition && <div ref={outgoing} className="day-page outgoing" inert aria-hidden="true"><div className="mobile-schedule">{children(transition.from, true)}</div></div>}
    <div ref={incoming} className="day-page"><div className="mobile-schedule">{children(day, false)}</div></div>
  </div>;
}
