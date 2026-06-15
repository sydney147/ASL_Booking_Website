export type Feature = { label: string; icon: string };
export type UnitFeatures = { room: Feature[]; building: Feature[] };

export const UNIT_FEATURES: Record<string, UnitFeatures> = {
  'room-2421': {
    room: [
      { label: 'Queen Size Bed + Pull-out Bed',        icon: 'bed' },
      { label: 'Fully Equipped Kitchen',               icon: 'kitchen' },
      { label: 'Fridge',                               icon: 'fridge' },
      { label: 'Smart TV (Netflix) & High Speed WiFi', icon: 'tv' },
      { label: 'Hot & Cold Shower',                    icon: 'shower' },
      { label: 'Aircon',                               icon: 'aircon' },
    ],
    building: [
      { label: '24/7 Concierge',         icon: 'concierge' },
      { label: 'City Lights & Mt. View', icon: 'view' },
      { label: 'Pool',                   icon: 'pool' },
      { label: 'Garden',                 icon: 'garden' },
      { label: 'Near IT Park (Dining & Business)',  icon: 'itpark' },
    ],
  },
  'room-2621': {
    room: [
      { label: 'Double/Full Size Bed + Sofa Bed',      icon: 'bed' },
      { label: 'Fully Equipped Kitchen',               icon: 'kitchen' },
      { label: 'Fridge',                               icon: 'fridge' },
      { label: 'Smart TV (Netflix) & High Speed WiFi', icon: 'tv' },
      { label: 'Hot & Cold Shower',                    icon: 'shower' },
      { label: 'Aircon',                               icon: 'aircon' },
    ],
    building: [
      { label: '24/7 Concierge',         icon: 'concierge' },
      { label: 'City Lights & Mt. View', icon: 'view' },
      { label: 'Pool',                   icon: 'pool' },
      { label: 'Garden',                 icon: 'garden' },
      { label: 'Near IT Park (Dining & Business)',  icon: 'itpark' },
    ],
  },
};

export const FEATURE_ICONS: Record<string, string> = {
  bed:       'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  kitchen:   'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  fridge:    'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  tv:        'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  shower:    'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
  aircon:    'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  concierge: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  view:      'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  pool:      'M3 7.5c1.5-1.5 3-2.25 4.5-2.25S10.5 6 12 7.5s3 2.25 4.5 2.25S19.5 9 21 7.5M3 12c1.5-1.5 3-2.25 4.5-2.25S10.5 10.5 12 12s3 2.25 4.5 2.25S19.5 13.5 21 12M3 16.5c1.5-1.5 3-2.25 4.5-2.25s3 .75 4.5 2.25 3 2.25 4.5 2.25S19.5 18 21 16.5',
  itpark:    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9',
  garden:    'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
};
