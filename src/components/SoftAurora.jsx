import { useEffect, useRef } from 'react';
import { animate, createScope } from 'animejs';

// Local React Bits-style background primitive. React Bits components are designed
// to be copied into a project and customized; this version is tailored to the player.
export default function SoftAurora({ active }) {
  const root = useRef(null);

  useEffect(() => {
    const scope = createScope({ root }).add(() => {
      animate('.aurora-blob', {
        x: () => Math.round(Math.random() * 48 - 24),
        y: () => Math.round(Math.random() * 34 - 17),
        rotate: () => Math.round(Math.random() * 30 - 15),
        scale: () => 0.92 + Math.random() * 0.2,
        duration: 5200,
        ease: 'inOutSine',
        loop: true,
        alternate: true,
      });
    });
    return () => scope.revert();
  }, []);

  return (
    <div className={`soft-aurora ${active ? 'is-active' : ''}`} ref={root} aria-hidden="true">
      <i className="aurora-blob blob-one" />
      <i className="aurora-blob blob-two" />
      <i className="aurora-blob blob-three" />
    </div>
  );
}
