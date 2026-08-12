import { useEffect, useMemo, useRef } from 'react';
import { animate, createScope, stagger } from 'animejs';

export default function SoundWave({ active, compact = false }) {
  const root = useRef(null);
  const bars = useMemo(() => Array.from({ length: compact ? 18 : 42 }), [compact]);

  useEffect(() => {
    if (!active || !root.current) return undefined;
    const scope = createScope({ root }).add(() => {
      animate('.wave-bar', {
        scaleY: () => 0.22 + Math.random() * 0.9,
        duration: () => 380 + Math.random() * 560,
        delay: stagger(22, { from: 'center' }),
        ease: 'inOutSine',
        loop: true,
        alternate: true,
      });
    });
    return () => scope.revert();
  }, [active, compact]);

  return (
    <div className={`sound-wave ${compact ? 'compact-wave' : ''} ${active ? 'playing' : ''}`} ref={root} aria-label={active ? 'Audio visualizer is active' : 'Audio visualizer is paused'}>
      {bars.map((_, index) => <span className="wave-bar" key={index} />)}
    </div>
  );
}
