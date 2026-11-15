// src/lib/supabaseBreaker.ts
// Resilient Circuit Breaker & High-Speed Timeout Runner for Supabase

let isHealthy = false;
let lastCheckTime = 0;
const HEALTH_CHECK_INTERVAL_MS = 60000; // 60-second cooldown before testing Supabase again

export function isSupabaseHealthy(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!url || url.includes('placeholder')) {
    return false;
  }
  const now = Date.now();
  // If marked unhealthy and cooldown has not elapsed, skip Supabase immediately
  if (!isHealthy && (now - lastCheckTime < HEALTH_CHECK_INTERVAL_MS)) {
    return false;
  }
  return true;
}

export function markSupabaseUnhealthy(err?: any) {
  isHealthy = false;
  lastCheckTime = Date.now();
  if (err) {
    console.warn(`[SupabaseBreaker] Tripped circuit breaker: ${err?.message || err}. Serving from high-speed local store.`);
  }
}

export function markSupabaseHealthy() {
  isHealthy = true;
  lastCheckTime = Date.now();
}

export async function runWithFastTimeout<T>(
  operation: () => Promise<T>,
  fallback: () => T | Promise<T>,
  timeoutMs: number = 800
): Promise<T> {
  if (!isSupabaseHealthy()) {
    return fallback();
  }

  let timer: NodeJS.Timeout | null = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Supabase query timeout')), timeoutMs);
    });

    const result = await Promise.race([
      operation(),
      timeoutPromise
    ]);

    markSupabaseHealthy();
    return result;
  } catch (err: any) {
    markSupabaseUnhealthy(err);
    return fallback();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
