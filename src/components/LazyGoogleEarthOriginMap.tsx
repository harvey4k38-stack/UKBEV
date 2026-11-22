import React, { Suspense, lazy } from 'react';

const Impl = lazy(() => import('./GoogleEarthOriginMap').then((m) => ({ default: m.GoogleEarthOriginMap })));

/** Google Maps is only downloaded when someone actually opens a satellite view. */
export function LazyGoogleEarthOriginMap(props: React.ComponentProps<typeof Impl>) {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-[#0B141E]" />}>
      <Impl {...props} />
    </Suspense>
  );
}
