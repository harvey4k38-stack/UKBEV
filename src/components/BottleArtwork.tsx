import React from 'react';
import type { BottleVisualStyle } from '../types';

interface BottleArtworkProps {
  brandName: string;
  bottleStyle: BottleVisualStyle;
  capColor: string;
  tintColor: string;
  labelAccent: string;
  sizeLabel: string;
  waterType: 'Still' | 'Sparkling';
  packaging: string;
  className?: string;
}

export function BottleArtwork({
  brandName,
  bottleStyle,
  capColor,
  tintColor,
  labelAccent,
  sizeLabel,
  waterType,
  packaging,
  className = '',
}: BottleArtworkProps) {
  const isFiji = bottleStyle === 'fiji_square';
  const isIcelandic = bottleStyle === 'icelandic_faceted';
  const isBox = bottleStyle === 'bulk_box';
  const isSparkling = waterType === 'Sparkling';
  const isGlass = packaging === 'Glass';

  const shortBrand = brandName
    .replace(' Natural Spring Water', '')
    .replace(' Water', '')
    .toUpperCase();

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[#EFECE6] ${className}`}
      aria-label={`${brandName} ${sizeLabel} ${waterType} ${packaging}`}
    >
      {/* Subtle studio stone shadow gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.65) 0%, rgba(239,236,230,0.4) 55%, rgba(215,209,198,0.45) 100%)',
        }}
      />

      {/* Travertine plinth */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-[18%] border-t border-black/5"
        style={{
          background: 'linear-gradient(180deg, #E5DFD3 0%, #D9D2C4 100%)',
        }}
      />

      {/* Studio Bottle Vector Render */}
      <svg
        viewBox="0 0 220 280"
        className="relative z-10 h-[86%] w-auto drop-shadow-[0_14px_18px_rgba(20,24,31,0.14)]"
        role="img"
        aria-label={`${brandName} ${sizeLabel}`}
      >
        <defs>
          <linearGradient id={`glass-${bottleStyle}-${shortBrand}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={tintColor} stopOpacity="0.96" />
            <stop offset="28%" stopColor="#FFFFFF" stopOpacity="0.92" />
            <stop offset="65%" stopColor={tintColor} stopOpacity="0.88" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id={`cap-${bottleStyle}-${shortBrand}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={capColor} />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor={capColor} />
          </linearGradient>
        </defs>

        {/* Contact shadow on plinth */}
        <ellipse cx="110" cy="252" rx={isBox ? 56 : 38} ry="7" fill="rgba(20,24,31,0.22)" />

        {isBox ? (
          <g>
            {/* 10L Bag-in-Box architectural carton */}
            <rect
              x="54"
              y="72"
              width="112"
              height="174"
              rx="6"
              fill="#F7F5F0"
              stroke="#C8C1B4"
              strokeWidth="1.5"
            />
            <rect x="54" y="72" width="112" height="24" rx="4" fill={labelAccent} opacity="0.9" />
            <rect x="66" y="114" width="88" height="72" fill="#FFFFFF" stroke="#E2DDD3" strokeWidth="1" />
            <text
              x="110"
              y="142"
              textAnchor="middle"
              fill="#14181F"
              fontSize="11"
              fontWeight="700"
              letterSpacing="1.6"
            >
              {shortBrand}
            </text>
            <text x="110" y="158" textAnchor="middle" fill={labelAccent} fontSize="8" fontWeight="600">
              {sizeLabel} · {waterType.toUpperCase()}
            </text>
            <text x="110" y="172" textAnchor="middle" fill="#64748B" fontSize="7">
              BAG-IN-BOX TAP
            </text>
            {/* Pouring tap */}
            <rect x="102" y="210" width="16" height="16" rx="3" fill={capColor} />
            <circle cx="110" cy="218" r="4" fill="#FFFFFF" opacity="0.6" />
          </g>
        ) : isFiji ? (
          <g>
            {/* Iconic square FIJI silhouette */}
            <rect x="95" y="34" width="30" height="18" rx="3" fill={`url(#cap-${bottleStyle}-${shortBrand})`} />
            <rect x="93" y="51" width="34" height="5" rx="2" fill="#E2E8F0" />
            <path
              d="M95 56 L125 56 L148 84 L148 240 Q148 250 138 250 L82 250 Q72 250 72 240 L72 84 Z"
              fill={`url(#glass-${bottleStyle}-${shortBrand})`}
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />
            {/* Vertical square edge highlight */}
            <line x1="88" y1="84" x2="88" y2="246" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" />
            <line x1="136" y1="84" x2="136" y2="246" stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
            {/* Label */}
            <rect x="77" y="112" width="66" height="92" rx="3" fill="#FFFFFF" opacity="0.94" stroke="#E2E8F0" />
            <rect x="77" y="112" width="66" height="6" fill={labelAccent} />
            <text
              x="110"
              y="148"
              textAnchor="middle"
              fill="#0F2D40"
              fontSize="16"
              fontWeight="700"
              letterSpacing="2.2"
            >
              FIJI
            </text>
            <text x="110" y="164" textAnchor="middle" fill={labelAccent} fontSize="7.5" fontWeight="600" letterSpacing="1">
              NATURAL ARTESIAN
            </text>
            <text x="110" y="186" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">
              {sizeLabel} · pH 7.7
            </text>
          </g>
        ) : isIcelandic ? (
          <g>
            {/* Faceted Icelandic Glacial silhouette */}
            <rect x="96" y="30" width="28" height="18" rx="3" fill={`url(#cap-${bottleStyle}-${shortBrand})`} />
            <path
              d="M96 48 L124 48 L138 92 L145 162 L139 242 Q138 250 128 250 L92 250 Q82 250 81 242 L75 162 L82 92 Z"
              fill={`url(#glass-${bottleStyle}-${shortBrand})`}
              stroke="#B8D4E3"
              strokeWidth="1.2"
            />
            {/* Glacial facets */}
            <polygon points="82,92 110,110 75,162" fill="rgba(255,255,255,0.35)" />
            <polygon points="138,92 110,110 145,162" fill="rgba(43,110,140,0.08)" />
            <rect x="81" y="122" width="58" height="74" rx="2" fill="rgba(255,255,255,0.9)" />
            <text x="110" y="146" textAnchor="middle" fill="#0F172A" fontSize="9.5" fontWeight="700" letterSpacing="1.2">
              ICELANDIC
            </text>
            <text x="110" y="159" textAnchor="middle" fill={labelAccent} fontSize="8.5" fontWeight="600" letterSpacing="1.4">
              GLACIAL
            </text>
            <text x="110" y="177" textAnchor="middle" fill="#475569" fontSize="7.5" fontFamily="monospace">
              {sizeLabel} · pH 8.4
            </text>
            <text x="110" y="189" textAnchor="middle" fill="#64748B" fontSize="6.5">
              {waterType.toUpperCase()}
            </text>
          </g>
        ) : (
          <g>
            {/* Classic European / Scottish / NZ Alpine cylindrical contour */}
            <rect x="97" y="28" width="26" height="16" rx="2.5" fill={`url(#cap-${bottleStyle}-${shortBrand})`} />
            <rect x="95" y="44" width="30" height="4" rx="1.5" fill="#CBD5E1" />
            <path
              d="M98 48 L122 48 L126 76 C138 90 143 102 143 122 L143 240 Q143 250 133 250 L87 250 Q77 250 77 240 L77 122 C77 102 82 90 94 76 Z"
              fill={`url(#glass-${bottleStyle}-${shortBrand})`}
              stroke={isGlass ? '#94A3B8' : '#CBD5E1'}
              strokeWidth="1.2"
            />
            {/* Specular vertical reflection */}
            <rect x="85" y="106" width="6" height="136" rx="3" fill="rgba(255,255,255,0.55)" />
            {/* Sparkling effervescence dots */}
            {isSparkling && (
              <g fill="#FFFFFF" opacity="0.8">
                <circle cx="98" cy="222" r="1.4" />
                <circle cx="122" cy="214" r="1.2" />
                <circle cx="105" cy="204" r="1.6" />
                <circle cx="118" cy="196" r="1.1" />
                <circle cx="95" cy="116" r="1.3" />
                <circle cx="125" cy="112" r="1.2" />
              </g>
            )}
            {/* Minimalist luxury label */}
            <rect x="78" y="124" width="64" height="72" fill="rgba(255,255,255,0.94)" stroke="#E2E8F0" strokeWidth="0.8" />
            <rect x="78" y="124" width="64" height="4" fill={labelAccent} />
            <text
              x="110"
              y="150"
              textAnchor="middle"
              fill="#14181F"
              fontSize={shortBrand.length > 10 ? '8.5' : '11'}
              fontWeight="700"
              letterSpacing="1.3"
            >
              {shortBrand}
            </text>
            <text x="110" y="165" textAnchor="middle" fill={labelAccent} fontSize="7.5" fontWeight="600" letterSpacing="1">
              {waterType.toUpperCase()} · {packaging.toUpperCase()}
            </text>
            <text x="110" y="182" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">
              {sizeLabel}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
