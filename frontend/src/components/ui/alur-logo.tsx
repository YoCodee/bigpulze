'use client';

import React, { useId } from 'react';
import {
  ALUR_SVG_VIEWBOX,
  ALUR_PATH_RIBBON_OUTER,
  ALUR_PATH_RIBBON_INNER,
  ALUR_DEPTH_PATHS,
} from './alur-logo-paths';

export interface AlurLogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  showShadows?: boolean;
}

/**
 * Official Alur ribbon loop mark (3D orange gradient with depth shadows)
 * Vector source: `logo_alur_icon (1).svg`
 */
export function AlurLogoIcon({
  size = 32,
  className = '',
  showShadows = true,
  style,
  ...rest
}: AlurLogoIconProps) {
  const rawId = useId();
  // Safe ID for SVG defs without special characters that could break URL references
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const gradOrangeId = `alur-grad-orange-${cleanId}`;
  const gradDarkId = `alur-grad-dark-${cleanId}`;
  const clipId = `alur-clip-${cleanId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={ALUR_SVG_VIEWBOX}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-label="Logo Alur"
      role="img"
      {...rest}
    >
      <defs>
        <linearGradient id={gradOrangeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="50%" stopColor="#FF5A00" />
          <stop offset="100%" stopColor="#EF4900" />
        </linearGradient>

        <linearGradient id={gradDarkId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D84E00" />
          <stop offset="100%" stopColor="#B83A00" />
        </linearGradient>

        <clipPath id={clipId}>
          <path d={ALUR_PATH_RIBBON_OUTER} />
          <path d={ALUR_PATH_RIBBON_INNER} />
        </clipPath>
      </defs>

      <g id="alur-app-icon">
        {/* Ribbon Base Layer with Orange Gradient */}
        <g id="icon-ribbon-base" fill={`url(#${gradOrangeId})`}>
          <path d={ALUR_PATH_RIBBON_OUTER} />
          <path d={ALUR_PATH_RIBBON_INNER} />
        </g>

        {/* 3D Depth & Fold Shadows */}
        {showShadows && (
          <g
            id="icon-ribbon-depth"
            clipPath={`url(#${clipId})`}
            fill={`url(#${gradDarkId})`}
            opacity="0.95"
          >
            {ALUR_DEPTH_PATHS.map((d, index) => (
              <path key={index} d={d} />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}

export interface AlurBrandProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  iconSize?: number;
  className?: string;
  textClassName?: string;
  badge?: string;
  badgeClassName?: string;
  subtitle?: string;
  variant?: 'dark' | 'light';
}

/**
 * Alur Logo Icon + Typography "Alur" side by side.
 * Uses font Plus Jakarta Sans (loaded globally).
 */
export function AlurBrand({
  size = 'md',
  iconSize,
  className = '',
  textClassName = '',
  badge,
  badgeClassName = '',
  subtitle,
  variant = 'dark',
}: AlurBrandProps) {
  const sizeConfig = {
    xs: { icon: 20, text: 'text-sm font-bold', gap: 'gap-1.5' },
    sm: { icon: 24, text: 'text-base font-bold', gap: 'gap-2' },
    md: { icon: 32, text: 'text-xl font-extrabold tracking-tight', gap: 'gap-2.5' },
    lg: { icon: 40, text: 'text-2xl font-black tracking-tight', gap: 'gap-3' },
    xl: { icon: 48, text: 'text-3xl font-black tracking-tight', gap: 'gap-3.5' },
  }[size];

  const finalIconSize = iconSize ?? sizeConfig.icon;
  const isLight = variant === 'light';

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105">
        <AlurLogoIcon size={finalIconSize} />
      </div>

      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-sans font-extrabold leading-none ${sizeConfig.text} ${
              isLight ? 'text-white' : 'text-stone-900'
            } ${textClassName}`}
          >
            Alur
          </span>

          {badge && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isLight
                  ? 'border border-white/30 bg-white/10 text-white'
                  : 'border border-orange-200 bg-orange-50 text-orange-700'
              } ${badgeClassName}`}
            >
              {badge}
            </span>
          )}
        </div>

        {subtitle && (
          <span
            className={`truncate text-xs font-medium leading-tight ${
              isLight ? 'text-white/80' : 'text-stone-500'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default AlurBrand;
