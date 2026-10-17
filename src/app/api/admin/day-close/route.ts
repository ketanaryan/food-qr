import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { isStaffAuthorized } from '@/lib/staffAuth';
import { isOwnerAuthorized } from '@/lib/ownerAuth';
import { consolidateOrders, ConsolidatedBill } from '@/lib/orderConsolidation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

const dataFilePath = path.join(process.cwd(), 'data', 'day-close-reports.json');
let memoryReports: DayCloseReport[] = [];

function readLocalReports(): DayCloseReport[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryReports = parsed;
        return parsed;
      }
    }
  } catch {}
  return memoryReports;
}

function saveLocalReports(reports: DayCloseReport[]) {
  memoryReports = reports;
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(reports, null, 2), 'utf-8');
  } catch {}
}

export interface DayCloseReport {
  id: string;
  date: string; // YYYY-MM-DD
  shift_start: string;
  closed_at: string;
  closed_by: string;
  opening_float: number;
  system_cash: number;
  system_upi: number;
  system_other: number;
  gross_sales: number;
  net_sales: number;
  total_tax: number;
  service_charge: number;
  total_bills: number;
  cash_drops: number;
  expected_cash: number;
  physical_cash: number;
  variance: number;
  status: 'BALANCED' | 'OVERAGE' | 'SHORTAGE';
  denominations: {
    '500': number;
    '200': number;
    '100': number;
    '50': number;
    '20': number;
    '10': number;
    'coins': number;
  };
  notes?: string;
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(req: Request) {
  try {
    const authorized = (await isStaffAuthorized(req)) || (await isOwnerAuthorized(req));
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || toLocalDateString(new Date());

    const [y, m, d] = dateParam.split('-').map(Number);
    const startObj = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endObj = new Date(y, m - 1, d, 23, 59, 59, 999);

    // Fetch window with buffer for orders placed right before midnight
    const fetchStart = new Date(startObj.getTime() - 24 * 60 * 60 * 1000);

    const { data: rawOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['completed', 'billing'])
      .gte('created_at', fetchStart.toISOString())
      .lte('created_at', endObj.toISOString())
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const consolidatedBills = consolidateOrders(rawOrders || []);

    // Filter bills belonging to this specific local day (by settled_at or created_at)
    const dayBills = consolidatedBills.filter(b => {
      const time = new Date(b.settled_at || b.created_at);
      return time >= startObj && time <= endObj;
    });

    let grossSales = 0;
    let netSales = 0;
    let totalTax = 0;
    let serviceCharge = 0;
    let systemCash = 0;
    let systemUpi = 0;
    let systemOther = 0;

    dayBills.forEach(b => {
      grossSales += b.grand_total;
      netSales += Math.max(0, b.subtotal - (b.discount || 0));
      totalTax += b.gst;
      serviceCharge += (b.service_charge || 0);

      if (b.payment_method === 'CASH') {
        systemCash += b.grand_total;
      } else if (b.payment_method === 'UPI') {
        systemUpi += b.grand_total;
      } else if (b.payment_method === 'SPLIT') {
        const cashPart = typeof b.split_cash === 'number' ? b.split_cash : Math.round(b.grand_total / 2);
        const upiPart = typeof b.split_upi === 'number' ? b.split_upi : (b.grand_total - cashPart);
        systemCash += cashPart;
        systemUpi += upiPart;
      } else {
        systemOther += b.grand_total;
      }
    });

    // Check existing stored reports
    let allReports: DayCloseReport[] = [];
    try {
      const { data: settingsData } = await supabase
        .from('hotel_settings')
        .select('value')
        .eq('key', 'day_close_reports')
        .maybeSingle();

      if (Array.isArray(settingsData?.value)) {
        allReports = settingsData.value;
      }
    } catch {}

    if (allReports.length === 0) {
      allReports = readLocalReports();
    }

    const closedReport = allReports.find(r => r.date === dateParam) || null;

    return NextResponse.json({
      success: true,
      date: dateParam,
      liveStats: {
        totalBills: dayBills.length,
        grossSales,
        netSales,
        totalTax,
        serviceCharge,
        systemCash,
        systemUpi,
        systemOther,
        defaultFloat: 2000
      },
      closedReport,
      allReports
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authorized = (await isStaffAuthorized(req)) || (await isOwnerAuthorized(req));
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Unauthorized staff access' }, { status: 401 });
    }

    const body = await req.json();
    const {
      date,
      shift_start,
      closed_by = 'Cashier Desk',
      opening_float = 2000,
      system_cash = 0,
      system_upi = 0,
      system_other = 0,
      gross_sales = 0,
      net_sales = 0,
      total_tax = 0,
      service_charge = 0,
      total_bills = 0,
      cash_drops = 0,
      physical_cash = 0,
      denominations = {
        '500': 0,
        '200': 0,
        '100': 0,
        '50': 0,
        '20': 0,
        '10': 0,
        'coins': 0
      },
      notes = ''
    } = body;

    const reportDate = date || toLocalDateString(new Date());
    const expected_cash = Number(opening_float) + Number(system_cash) - Number(cash_drops);
    const variance = Number(physical_cash) - expected_cash;

    let status: 'BALANCED' | 'OVERAGE' | 'SHORTAGE' = 'BALANCED';
    if (variance > 0) status = 'OVERAGE';
    else if (variance < 0) status = 'SHORTAGE';

    const newReport: DayCloseReport = {
      id: `Z-${reportDate.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: reportDate,
      shift_start: shift_start || new Date().toISOString(),
      closed_at: new Date().toISOString(),
      closed_by,
      opening_float: Number(opening_float),
      system_cash: Number(system_cash),
      system_upi: Number(system_upi),
      system_other: Number(system_other),
      gross_sales: Number(gross_sales),
      net_sales: Number(net_sales),
      total_tax: Number(total_tax),
      service_charge: Number(service_charge),
      total_bills: Number(total_bills),
      cash_drops: Number(cash_drops),
      expected_cash,
      physical_cash: Number(physical_cash),
      variance,
      status,
      denominations,
      notes: String(notes || '').trim()
    };

    // Read current reports array from Supabase or local storage
    let reports: DayCloseReport[] = [];
    try {
      const { data: settingsData } = await supabase
        .from('hotel_settings')
        .select('value')
        .eq('key', 'day_close_reports')
        .maybeSingle();

      if (Array.isArray(settingsData?.value)) {
        reports = settingsData.value;
      }
    } catch {}

    if (reports.length === 0) {
      reports = readLocalReports();
    }
    
    // Replace if report for this date exists, otherwise prepend
    const existingIndex = reports.findIndex(r => r.date === reportDate);
    if (existingIndex >= 0) {
      reports[existingIndex] = newReport;
    } else {
      reports.unshift(newReport);
    }

    // Always persist to local file and memory
    saveLocalReports(reports);

    // Try persisting to Supabase hotel_settings (graceful fallback if service role key not yet provided)
    try {
      const { error: upsertError } = await supabase
        .from('hotel_settings')
        .upsert({
          key: 'day_close_reports',
          value: reports,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (upsertError) {
        console.warn('Supabase day_close_reports upsert note:', upsertError.message);
      }
    } catch (upsertErr: any) {
      console.warn('Supabase day_close_reports upsert exception:', upsertErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'End-of-Day Z-Report saved successfully',
      report: newReport
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
