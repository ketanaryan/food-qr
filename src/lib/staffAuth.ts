const SECRET_KEY = process.env.TABLE_SECRET_KEY || 'white-bliss-secure-key-2026';

export function getExpectedCredentials() {
  const user = process.env.ADMIN_USERNAME || 'admin';
  const pwd = process.env.ADMIN_PASSWORD || 'aryan123';
  return { user, pwd };
}

// Edge-runtime compatible signature generator (no node:crypto dependency)
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

export function getStaffSessionToken(): string {
  const { user, pwd } = getExpectedCredentials();
  return `wb_staff_${computeSignature(`${user}:${pwd}:${SECRET_KEY}:verified_session`)}`;
}

export function isStaffAuthorized(req: Request | any): boolean {
  try {
    const { user: expectedUser, pwd: expectedPwd } = getExpectedCredentials();

    // 1. Check Authorization Header (Basic Auth: "Basic <base64>")
    let authHeader = '';
    if (typeof req.headers?.get === 'function') {
      authHeader = req.headers.get('authorization') || '';
    } else if (req.headers?.authorization) {
      authHeader = req.headers.authorization;
    }

    if (authHeader && authHeader.startsWith('Basic ')) {
      const b64 = authHeader.split(' ')[1];
      if (b64) {
        // atob is globally available in both Edge Runtime and Node 18+
        const decoded = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
        const [u, p] = decoded.split(':');
        if (u === expectedUser && p === expectedPwd) {
          return true;
        }
      }
    }

    // 2. Check Staff Access Override Header
    let staffAccess = '';
    if (typeof req.headers?.get === 'function') {
      staffAccess = req.headers.get('x-staff-access') || '';
    } else if (req.headers?.['x-staff-access']) {
      staffAccess = req.headers['x-staff-access'];
    }

    if (staffAccess === 'pos_secure_override') {
      return true;
    }

    // 3. Check Custom Staff Token Header
    let customToken = '';
    if (typeof req.headers?.get === 'function') {
      customToken = req.headers.get('x-staff-token') || '';
    } else if (req.headers?.['x-staff-token']) {
      customToken = req.headers['x-staff-token'];
    }

    if (customToken && customToken === getStaffSessionToken()) {
      return true;
    }

    // 3. Check HttpOnly Cookie (staff_session)
    let cookieVal = '';
    if (typeof req.cookies?.get === 'function') {
      cookieVal = req.cookies.get('staff_session')?.value || '';
    } else {
      let cookieHeader = '';
      if (typeof req.headers?.get === 'function') {
        cookieHeader = req.headers.get('cookie') || '';
      } else if (req.headers?.cookie) {
        cookieHeader = String(req.headers.cookie);
      }

      if (cookieHeader) {
        const match = cookieHeader.match(/staff_session=([^;]+)/);
        if (match) cookieVal = match[1];
      }
    }

    if (cookieVal && cookieVal === getStaffSessionToken()) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}
