import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DEFAULT_CAPTAINS = [
  "Rahul (Lead Captain)",
  "Manoj (Captain)",
  "Vikram (Captain)",
  "Suresh (Captain)"
];

let memoryCaptains = [...DEFAULT_CAPTAINS];
const filePath = path.join(process.cwd(), 'data', 'captains.json');

function readCaptains(): string[] {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCaptains = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to memory
  }
  return memoryCaptains;
}

function saveCaptains(captains: string[]) {
  memoryCaptains = captains;
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(captains, null, 2), 'utf-8');
  } catch {
    // In serverless environments, file write might fail, memory will retain
  }
}

export async function GET() {
  const captains = readCaptains();
  return NextResponse.json({ success: true, captains });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { captains } = body;
    if (!Array.isArray(captains) || captains.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid captains list' }, { status: 400 });
    }

    const cleanCaptains = captains
      .map(c => String(c).trim())
      .filter(c => c.length > 0 && c.length < 100);

    if (cleanCaptains.length === 0) {
      return NextResponse.json({ success: false, message: 'At least 1 valid captain required' }, { status: 400 });
    }

    saveCaptains(cleanCaptains);
    return NextResponse.json({ success: true, captains: cleanCaptains });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
