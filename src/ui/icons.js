/**
 * behavior.lock - Phosphor Icon Library
 * Precision geometric SVG components inspired by Phosphor Icons
 * Zero external dependencies
 */

import React from 'react';

function createPhosphorIcon(svgPaths, defaultProps = {}) {
  return function PhosphorIcon({
    size = 18,
    color = 'currentColor',
    weight = 'regular',
    className = '',
    style = {},
    ...props
  }) {
    const strokeWidth = weight === 'bold' ? 2.5 : weight === 'light' ? 1.5 : 2;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 align-middle inline-block ${className}`}
        style={style}
        {...props}
        dangerouslySetInnerHTML={{ __html: svgPaths }}
      />
    );
  };
}

// Security & Shielding
export const ShieldCheck = createPhosphorIcon(
  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 12 14 22 4"/>'
);

export const ShieldWarning = createPhosphorIcon(
  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.75" fill="currentColor"/>'
);

export const ShieldChevron = createPhosphorIcon(
  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m8 11 4 4 4-4"/>'
);

export const LockKey = createPhosphorIcon(
  '<rect x="5" y="11" width="14" height="10" rx="2.5"/><circle cx="12" cy="16" r="1.2" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
);

// Alerts & Badges
export const WarningOctagon = createPhosphorIcon(
  '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.75" fill="currentColor"/>'
);

export const WarningCircle = createPhosphorIcon(
  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.75" fill="currentColor"/>'
);

export const CheckCircle = createPhosphorIcon(
  '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
);

// Tracing & Runtime Pulse
export const Pulse = createPhosphorIcon(
  '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'
);

export const Crosshair = createPhosphorIcon(
  '<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>'
);

export const TerminalWindow = createPhosphorIcon(
  '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 11 3 2-3 2"/><line x1="13" y1="15" x2="17" y2="15"/><line x1="3" y1="8" x2="21" y2="8"/>'
);

export const GitFork = createPhosphorIcon(
  '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><line x1="12" y1="12" x2="12" y2="15"/>'
);

export const Stack = createPhosphorIcon(
  '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/>'
);

export const FileCode = createPhosphorIcon(
  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>'
);

export const Key = createPhosphorIcon(
  '<path d="m21 2-2 2m-1.5 1.5L14 9l-4 4-2-2-4 4 3 3 5-5 2-2 3.5-3.5z"/><circle cx="7.5" cy="16.5" r="1.5"/>'
);

export const Globe = createPhosphorIcon(
  '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
);

export const Cpu = createPhosphorIcon(
  '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'
);

export const Package = createPhosphorIcon(
  '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'
);

export const MagnifyingGlass = createPhosphorIcon(
  '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'
);

export const FunnelSimple = createPhosphorIcon(
  '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'
);

export const Copy = createPhosphorIcon(
  '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
);

export const Check = createPhosphorIcon(
  '<polyline points="20 6 9 17 4 12"/>'
);

export const ArrowUpRight = createPhosphorIcon(
  '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>'
);

export const Sparkle = createPhosphorIcon(
  '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>'
);
