import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  Pin,
  useApiLoadingStatus,
  APILoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { Map3D, MapMode, Marker3D, type Map3DRef } from '@vis.gl/react-google-maps/3d';
import type { Brand } from '../types';
import { detectSoftwareWebGL, isWebGL2Available } from '../three/webglUtils';

const UK_HUB = {
  lat: 51.5315,
  lng: -0.2797,
  label: 'UK Beverages Hub · Park Royal, London',
};

interface GoogleEarthOriginMapProps {
  brands: Brand[];
  selectedBrandId: string | null;
  onSelectBrand: (brand: Brand | null) => void;
  defaultRange?: number;
  defaultZoom?: number;
  heightClassName?: string;
}

function getTargetCamera(brands: Brand[], selectedBrandId: string | null, defaultRange: number, defaultZoom: number) {
  const active = brands.find((b) => b.id === selectedBrandId);
  if (active) {
    return {
      lat: active.coordinates.lat,
      lng: active.coordinates.lng,
      altitude: 1200,
      range: defaultRange,
      tilt: 64,
      heading: 18,
      zoom: defaultZoom,
      title: `${active.name} · ${active.sourceName}`,
    };
  }
  return {
    lat: UK_HUB.lat,
    lng: UK_HUB.lng,
    altitude: 900,
    range: defaultRange * 4.5,
    tilt: 48,
    heading: 0,
    zoom: Math.max(4, defaultZoom - 7),
    title: UK_HUB.label,
  };
}

function Satellite2DCameraController({
  target,
}: {
  target: { lat: number; lng: number; zoom: number };
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: target.lat, lng: target.lng });
    map.setZoom(target.zoom);
  }, [map, target.lat, target.lng, target.zoom]);
  return null;
}

function SatelliteMapInner({
  brands,
  selectedBrandId,
  onSelectBrand,
  defaultRange,
  defaultZoom,
  prefer3D,
}: {
  brands: Brand[];
  selectedBrandId: string | null;
  onSelectBrand: (brand: Brand | null) => void;
  defaultRange: number;
  defaultZoom: number;
  prefer3D: boolean;
}) {
  const loadingStatus = useApiLoadingStatus();
  const map3dRef = useRef<Map3DRef | null>(null);
  const [map3dFailed, setMap3dFailed] = useState(false);

  const target = useMemo(
    () => getTargetCamera(brands, selectedBrandId, defaultRange, defaultZoom),
    [brands, selectedBrandId, defaultRange, defaultZoom]
  );

  const use3D = prefer3D && !map3dFailed;

  // Smooth fly-to on Map3D when selected brand changes
  useEffect(() => {
    if (!use3D || !map3dRef.current?.flyCameraTo) return;
    try {
      map3dRef.current.flyCameraTo({
        endCamera: {
          center: { lat: target.lat, lng: target.lng, altitude: target.altitude },
          range: target.range,
          tilt: target.tilt,
          heading: target.heading,
          roll: 0,
        },
        durationMillis: 1400,
      });
    } catch {
      // Fallback if camera animation unavailable
    }
  }, [use3D, target.lat, target.lng, target.altitude, target.range, target.tilt, target.heading]);

  const handleMap3dError = useCallback(() => {
    setMap3dFailed(true);
  }, []);

  if (loadingStatus === APILoadingStatus.FAILED || loadingStatus === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0B141E] text-slate-300 p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#7CC4D8]">Satellite View Unavailable</p>
          <p className="text-sm">
            Unable to load Google Maps imagery right now. Switch back to 3D Orbital Globe to continue exploring origins.
          </p>
        </div>
      </div>
    );
  }

  if (use3D) {
    return (
      <Map3D
        ref={map3dRef}
        mode={MapMode.HYBRID}
        defaultCenter={{ lat: target.lat, lng: target.lng, altitude: target.altitude }}
        defaultRange={target.range}
        defaultTilt={target.tilt}
        defaultHeading={target.heading}
        defaultRoll={0}
        onError={handleMap3dError}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {brands.map((brand) => (
          <Marker3D
            key={brand.id}
            position={{ lat: brand.coordinates.lat, lng: brand.coordinates.lng, altitude: 180 }}
            altitudeMode="RELATIVE_TO_GROUND"
            extruded
            label={brand.name}
            title={`${brand.name} — ${brand.sourceName}`}
            onClick={() => onSelectBrand(brand)}
          />
        ))}
        <Marker3D
          position={{ lat: UK_HUB.lat, lng: UK_HUB.lng, altitude: 120 }}
          altitudeMode="RELATIVE_TO_GROUND"
          extruded
          label="UK Beverages Hub"
          title={UK_HUB.label}
        />
      </Map3D>
    );
  }

  return (
    <GoogleMap
      mapId="DEMO_MAP_ID"
      mapTypeId="hybrid"
      defaultCenter={{ lat: target.lat, lng: target.lng }}
      defaultZoom={target.zoom}
      gestureHandling="greedy"
      streetViewControl={false}
      mapTypeControl={true}
      fullscreenControl={false}
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      style={{ width: '100%', height: '100%' }}
    >
      <Satellite2DCameraController target={target} />
      {brands.map((brand) => (
        <AdvancedMarker
          key={brand.id}
          position={{ lat: brand.coordinates.lat, lng: brand.coordinates.lng }}
          title={`${brand.name} — ${brand.sourceName}`}
          onClick={() => onSelectBrand(brand)}
        >
          <Pin
            background={brand.accentHex || '#0F5C6E'}
            borderColor="#FFFFFF"
            glyphColor="#FFFFFF"
            scale={brand.id === selectedBrandId ? 1.25 : 1}
          />
        </AdvancedMarker>
      ))}
      <AdvancedMarker
        position={{ lat: UK_HUB.lat, lng: UK_HUB.lng }}
        title={UK_HUB.label}
      >
        <Pin background="#14181F" borderColor="#FFFFFF" glyphColor="#7CC4D8" />
      </AdvancedMarker>
    </GoogleMap>
  );
}

export function GoogleEarthOriginMap({
  brands,
  selectedBrandId,
  onSelectBrand,
  defaultRange = 18000,
  defaultZoom = 12,
  heightClassName = 'w-full h-full',
}: GoogleEarthOriginMapProps) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const canTry3D = useMemo(() => isWebGL2Available() && !detectSoftwareWebGL(), []);
  const [prefer3D, setPrefer3D] = useState(canTry3D);

  if (!apiKey) {
    return (
      <div className={`${heightClassName} flex items-center justify-center bg-[#08121C] text-slate-300 p-6 text-center`}>
        <div className="max-w-md space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#7CC4D8]">Satellite Provenance</p>
          <p className="text-sm">
            Google Maps Satellite view requires an active Maps API key in this environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${heightClassName}`}>
      <APIProvider
        apiKey={apiKey}
        libraries={canTry3D ? ['maps3d', 'marker'] : ['marker']}
        language="en"
        region="GB"
      >
        <SatelliteMapInner
          brands={brands}
          selectedBrandId={selectedBrandId}
          onSelectBrand={onSelectBrand}
          defaultRange={defaultRange}
          defaultZoom={defaultZoom}
          prefer3D={prefer3D}
        />
      </APIProvider>

      {canTry3D && (
        <div className="absolute top-4 right-6 z-20 flex items-center gap-1 rounded-lg border border-white/20 bg-[#0B141E]/90 p-1 text-xs">
          <button
            type="button"
            onClick={() => setPrefer3D(true)}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              prefer3D ? 'bg-white text-[#0B141E]' : 'text-slate-300 hover:text-white'
            }`}
          >
            3D Photorealistic
          </button>
          <button
            type="button"
            onClick={() => setPrefer3D(false)}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              !prefer3D ? 'bg-white text-[#0B141E]' : 'text-slate-300 hover:text-white'
            }`}
          >
            Satellite 2D
          </button>
        </div>
      )}
    </div>
  );
}
