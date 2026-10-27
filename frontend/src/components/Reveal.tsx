import type { ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

/** Fades and slides its content up the first time it scrolls into view. */
export default function Reveal({ children }: { children: ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);

  return (
    <div ref={ref} className={`reveal${inView ? ' in' : ''}`}>
      {children}
    </div>
  );
}
