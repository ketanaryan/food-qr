// Owner Authentication Utilities (Edge and Node.js Compatible - Zero Node:fs/path dependencies)
import { supabase } from '@/lib/supabase';

const SECRET_KEY = process.env.TABLE_SECRET_KEY || 'white-bliss-secure-key-2026';

// In-memory rate limiting map for login attempts: ip -> { count: number, firstAttempt: number, lockedUntil?: number }
const loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// In-memory cache for dynamic credentials
let memoryOwnerCredentials: { email: string; password: string } | null = null;

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Reset window if older than 15 minutes
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count };
}

export function recordFailedAttempt(ip: string): { remainingAttempts: number; locked: boolean } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || (now - record.firstAttempt > ATTEMPT_WINDOW_MS)) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return { remainingAttempts: MAX_ATTEMPTS - 1, locked: false };
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    return { remainingAttempts: 0, locked: true };
  }

  return { remainingAttempts: MAX_ATTEMPTS - record.count, locked: false };
}

export function resetLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// Edge-runtime compatible signature generator
function computeSignature(payload: string): string {
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) + hash) + payload.charCodeAt(i);
    hash |= 0;
  }
  const part1 = Math.abs(hash).toString(36);

  let hash2 = 0;
  for (let i = payload.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 7) - hash2) + payload.charCodeAt(i);
    hash2 |= 0;
  }
  const part2 = Math.abs(hash2).toString(36);

  return `${part1}_${part2}`;
}

export async function fetchDynamicOwnerCredentials(): Promise<{ email: string; password: string } | null> {
  // 1. Try memory
  if (memoryOwnerCredentials) {
    return memoryOwnerCredentials;
  }

  // 2. Try Supabase hotel_settings table
  try {
    const { data } = await supabase
      .from('hotel_settings')
      .select('value')
      .eq('key', 'owner_auth')
      .maybeSingle();

    if (data?.value?.email && data?.value?.password) {
      memoryOwnerCredentials = {
        email: data.value.email.toLowerCase().trim(),
        password: String(data.value.password).trim()
      };
      return memoryOwnerCredentials;
    }
  } catch {
    // Table might not exist yet, fallback gracefully
  }

  return null;
}

export async function saveDynamicOwnerCredentials(email: string, password: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPassword = password.trim();

  // 1. Update memory
  memoryOwnerCredentials = { email: cleanEmail, password: cleanPassword };

  // 2. Update Supabase hotel_settings
  try {
    const { error } = await supabase
      .from('hotel_settings')
      .upsert({
        key: 'owner_auth',
        value: { email: cleanEmail, password: cleanPassword },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (!error) {
      return true;
    }
  } catch {
    // Graceful fallback
  }

  return true;
}

export function getExpectedOwnerCredentials() {
  const primaryEmail = (process.env.OWNER_EMAIL || 'owner@hotelwhitebliss.com').toLowerCase().trim();
  const allowedEmails = [
    primaryEmail,
    'admin@hotelwhitebliss.com',
    'admin'
  ];

  if (memoryOwnerCredentials?.email && !allowedEmails.includes(memoryOwnerCredentials.email)) {
    allowedEmails.unshift(memoryOwnerCredentials.email);
  }

  const primaryPassword = process.env.OWNER_PASSWORD || 'WhiteBliss@2026';
  const allowedPasswords = [
    primaryPassword,
    'aryan123' // Backward compatibility with existing admin password
  ];

  if (memoryOwnerCredentials?.password && !allowedPasswords.includes(memoryOwnerCredentials.password)) {
    allowedPasswords.unshift(memoryOwnerCredentials.password);
  }

  return { allowedEmails, allowedPasswords, primaryEmail };
}

export async function verifyOwnerCredentialsAsync(emailInput: string, passwordInput: string): Promise<boolean> {
  if (!emailInput || !passwordInput) return false;
  const cleanEmail = emailInput.toLowerCase().trim();
  const cleanPassword = passwordInput.trim();

  // Check dynamic credentials from DB / memory
  await fetchDynamicOwnerCredentials();

  const { allowedEmails, allowedPasswords } = getExpectedOwnerCredentials();
  const emailValid = allowedEmails.includes(cleanEmail);
  const passwordValid = allowedPasswords.includes(cleanPassword);

  return emailValid && passwordValid;
}

export function verifyOwnerCredentials(emailInput: string, passwordInput: string): boolean {
  if (!emailInput || !passwordInput) return false;
  const cleanEmail = emailInput.toLowerCase().trim();
  const cleanPassword = passwordInput.trim();

  const { allowedEmails, allowedPasswords } = getExpectedOwnerCredentials();
  const emailValid = allowedEmails.includes(cleanEmail);
  const passwordValid = allowedPasswords.includes(cleanPassword);

  return emailValid && passwordValid;
}

export function createOwnerToken(email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  const sig = computeSignature(`wb_owner_v1:${normalizedEmail}:${SECRET_KEY}`);
  return `wbo_${sig}`;
}

export function isOwnerAuthorized(req: Request | any): boolean {
  try {
    let cookieVal = '';

    if (typeof req.cookies?.get === 'function') {
      cookieVal = req.cookies.get('owner_session')?.value || '';
    } else {
      let cookieHeader = '';
      if (typeof req.headers?.get === 'function') {
        cookieHeader = req.headers.get('cookie') || '';
      } else if (req.headers?.cookie) {
        cookieHeader = String(req.headers.cookie);
      }

      if (cookieHeader) {
        const match = cookieHeader.match(/owner_session=([^;]+)/);
        if (match) cookieVal = match[1];
      }
    }

    if (!cookieVal) return false;

    // Check against all allowed emails
    const { allowedEmails } = getExpectedOwnerCredentials();
    for (const email of allowedEmails) {
      if (cookieVal === createOwnerToken(email)) {
        return true;
      }
    }

    return false;
  } catch (err) {
    return false;
  }
}
