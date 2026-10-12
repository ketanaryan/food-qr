import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hotel White Bliss — Digital Restaurant & POS',
    short_name: 'White Bliss',
    description: 'Hotel White Bliss 360° Digital Restaurant System — Captain Ordering, Cashier Billing, Kitchen KDS & Attendo Payroll',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Captain Ordering Portal',
        short_name: 'Captain',
        description: 'Floor order punch & KOT generation',
        url: '/captain',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Attendo & Payroll Engine',
        short_name: 'Attendo',
        description: 'Staff attendance & salary register',
        url: '/admin/attendo',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Cashier & Billing Desk',
        short_name: 'Cashier',
        description: 'Table settlement & thermal printing',
        url: '/cashier',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Kitchen Display System (KDS)',
        short_name: 'Kitchen',
        description: 'Live chef screen with voice alerts',
        url: '/kitchen',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
      }
    ]
  };
}
