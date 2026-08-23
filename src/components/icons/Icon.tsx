import type { SVGProps } from 'react';

export type IconName =
  | 'aetherium'
  | 'files'
  | 'search'
  | 'source'
  | 'sparkles'
  | 'settings'
  | 'terminal'
  | 'folder'
  | 'file'
  | 'chevron-right'
  | 'chevron-down'
  | 'close'
  | 'minus'
  | 'maximize'
  | 'sun'
  | 'moon'
  | 'command'
  | 'plus'
  | 'refresh'
  | 'branch'
  | 'bell'
  | 'code'
  | 'panel'
  | 'arrow-right'
  | 'check'
  | 'heart';

const paths: Record<IconName, React.ReactNode> = {
  aetherium: <><path d="M12 2 4 6.6v8.8L12 20l8-4.6V6.6L12 2Z"/><path d="m8.2 14.8 3.8-8 3.8 8M9.4 12.2h5.2"/></>,
  files: <><path d="M6.5 3.5h6l3 3v12h-9z"/><path d="M12.5 3.5v3h3M4 6.5v12a2 2 0 0 0 2 2h7"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 4.5 4.5"/></>,
  source: <><circle cx="7" cy="5" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="7" cy="19" r="2"/><path d="M7 7v10M9 6h3a5 5 0 0 1 5 5v-2"/></>,
  sparkles: <><path d="m12 3 .8 2.3a5 5 0 0 0 3 3L18 9l-2.2.8a5 5 0 0 0-3 3L12 15l-.8-2.2a5 5 0 0 0-3-3L6 9l2.2-.7a5 5 0 0 0 3-3L12 3Z"/><path d="m18 15 .4 1.1a2.5 2.5 0 0 0 1.5 1.5L21 18l-1.1.4a2.5 2.5 0 0 0-1.5 1.5L18 21l-.4-1.1a2.5 2.5 0 0 0-1.5-1.5L15 18l1.1-.4a2.5 2.5 0 0 0 1.5-1.5L18 15Z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  terminal: <><path d="m5 7 4 4-4 4M11 16h7"/><rect x="2.5" y="4" width="19" height="16" rx="2"/></>,
  folder: <path d="M3 6.5h7l2 2h9l-1.5 10h-16z"/>,
  file: <><path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4"/></>,
  'chevron-right': <path d="m9 5 7 7-7 7"/>,
  'chevron-down': <path d="m5 9 7 7 7-7"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  minus: <path d="M5 12h14"/>,
  maximize: <rect x="5" y="5" width="14" height="14" rx="1"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/>,
  command: <><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  refresh: <><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></>,
  branch: <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10M8 6h4a6 6 0 0 1 6 6V9"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M10 20h4"/></>,
  code: <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 6l-4 12"/>,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16"/></>,
  'arrow-right': <path d="M5 12h14M14 7l5 5-5 5"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  heart: <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/>,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
