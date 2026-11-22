import React, { Suspense, lazy, useEffect, useState } from 'react';

/**
 * Code-split entry points for the WebGL scenes. three.js + post-processing only download
 * on pages that use them, and only after the browser is idle, so text and buttons paint first.
 */

const HeroGlobe3DImpl = lazy(() => import('./HeroGlobe3D').then((m) => ({ default: m.HeroGlobe3D })));
const Bottle3DViewerImpl = lazy(() => import('./Bottle3DViewer').then((m) => ({ default: m.Bottle3DViewer })));

function useWhenIdle(timeout = 1200) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, [timeout]);
  return ready;
}

export function HeroGlobe3D(props: React.ComponentProps<typeof HeroGlobe3DImpl>) {
  const ready = useWhenIdle();
  const fallback = <div className="absolute inset-0 bg-[#060E17]" aria-hidden="true" />;
  if (!ready) return fallback;
  return (
    <Suspense fallback={fallback}>
      <HeroGlobe3DImpl {...props} />
    </Suspense>
  );
}

export function Bottle3DViewer(
  props: React.ComponentProps<typeof Bottle3DViewerImpl> & { fallback: React.ReactNode }
) {
  const { fallback, ...rest } = props;
  const ready = useWhenIdle(800);
  if (!ready) return <>{fallback}</>;
  return (
    <Suspense fallback={fallback}>
      <Bottle3DViewerImpl {...rest} />
    </Suspense>
  );
}
