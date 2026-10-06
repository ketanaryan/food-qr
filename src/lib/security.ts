import crypto from 'crypto';

export function verifyTableToken(table: string, token: string | null): boolean {
  if (process.env.NODE_ENV !== 'production' && !token) return true; // Allow dev testing without token
  if (!token) return false;
  
  const SECRET_KEY = process.env.TABLE_SECRET_KEY || 'default-secret-do-not-use-in-prod';
  const expectedToken = crypto.createHmac('sha256', SECRET_KEY).update(table).digest('hex').substring(0, 10);
  
  return token === expectedToken;
}
