/**
 * WhatsApp integration utility for Hotel Marquis POS & Digital System.
 * Fixes mobile blank white screen / orphaned Safari sheet issue when returning from WhatsApp.
 */

export function openWhatsApp(phone: string, text: string): void {
  if (typeof window === 'undefined') return;

  const rawPhone = String(phone || '').replace(/\D/g, '');
  if (!rawPhone) return;

  // Normalize Indian mobile number format (prefix 91 if 10 digits)
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const encodedText = encodeURIComponent(text);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  // Check if running on mobile device (iOS / Android)
  const userAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || navigator.vendor || '') : '';
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  if (isMobile) {
    // On iOS Safari & mobile Chrome, window.open(..., '_blank') creates an orphaned blank tab
    // with an 'X' button that stays stuck when returning to the app.
    // Setting window.location.href triggers the native WhatsApp app via Universal Link
    // directly from the current tab without leaving behind any blank popup window.
    window.location.href = waUrl;
  } else {
    // On desktop, opening in a new tab allows POS / Cashier to stay open while launching WhatsApp Web
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function formatBillWhatsAppMessage(params: {
  tableName: string;
  orderIds: string;
  grandTotal: number;
  paymentText: string;
  subtotal?: number;
  tax?: number;
  origin?: string;
}): string {
  const { tableName, orderIds, grandTotal, paymentText, origin } = params;
  const host = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  const cleanUrl = `${host}/bill/${orderIds}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return [
    `🧾 *HOTEL MARQUIS* 🧾`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `✨ *Pure Veg Multicuisine & Banquets*`,
    `🍽️ *${tableName}* | 📅 ${dateStr}, ${timeStr}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💳 *GRAND TOTAL: ₹${grandTotal}*`,
    `Payment Status: ✅ ${paymentText}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📄 *View & Download Official PDF Bill:*`,
    `${cleanUrl}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⭐ *Rate Your Experience on Google:*`,
    `https://www.google.com/search?q=Marquis+Pure+Veg+Nashik`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Thank you for dining with us! 🙏`
  ].join('\n');
}

export function formatReservationWhatsAppMessage(params: {
  guestName: string;
  date: string;
  time: string;
  guests: number | string;
}): string {
  const { guestName, date, time, guests } = params;
  return [
    `🎉 *RESERVATION CONFIRMED!* 🎉`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Hello *${guestName || 'Valued Guest'}*,`,
    `Your table booking at *HOTEL MARQUIS* is confirmed! ✨`,
    ``,
    `📅 *Date:* ${date}`,
    `⏰ *Time:* ${time}`,
    `👥 *Guests:* ${guests}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📍 *Address:* Sula Vineyard Road, opp. Podar School, Nashik 422012`,
    `📞 *Helpdesk:* 0788 788 1769`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `We look forward to hosting you! 🙏`
  ].join('\n');
}
