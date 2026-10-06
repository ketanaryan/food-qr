import React from 'react';
import OrderTrackingClient from './OrderTrackingClient';
import { verifyTableToken } from '@/lib/security';

export default async function OrderTrackingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const param = await params;
  const search = await searchParams;
  
  if (!verifyTableToken(param.id, search.token || null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="p-6 bg-white rounded-xl shadow-md text-center max-w-sm">
          <h1 className="text-xl font-bold text-red-600 mb-2">Invalid Session</h1>
          <p className="text-gray-500 text-sm">Please scan the QR code on your table again to view your orders.</p>
        </div>
      </div>
    );
  }

  // Pass down the resolved params so the client component doesn't need to await them
  return <OrderTrackingClient tableId={param.id} />;
}
