import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_STR = process.env.DAYFLOW_JWT_SECRET || 'fallback_default_jwt_secret_must_be_32_chars_long_minimum';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function signSessionJWT() {
  return await new SignJWT({ role: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifySessionJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// In-memory rate limiting map
// Key: IP string, Value: Array of timestamps of failed attempts
const failedAttemptsMap = new Map<string, number[]>();

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; cooldownTime: number } {
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  
  let attempts = failedAttemptsMap.get(ip) || [];
  
  // Filter out attempts older than 1 minute
  attempts = attempts.filter((timestamp) => now - timestamp < limitWindow);
  failedAttemptsMap.set(ip, attempts);

  if (attempts.length >= 5) {
    // Cooldown is 60 seconds from the 5th failure
    const lastAttempt = attempts[attempts.length - 1];
    const timePassed = now - lastAttempt;
    const cooldownRemaining = Math.max(0, Math.ceil((60000 - timePassed) / 1000));
    
    if (cooldownRemaining > 0) {
      return {
        allowed: false,
        remainingAttempts: 0,
        cooldownTime: cooldownRemaining,
      };
    } else {
      // Cooldown passed, reset
      failedAttemptsMap.delete(ip);
      return {
        allowed: true,
        remainingAttempts: 5,
        cooldownTime: 0,
      };
    }
  }

  return {
    allowed: true,
    remainingAttempts: 5 - attempts.length,
    cooldownTime: 0,
  };
}

export function recordFailedAttempt(ip: string): void {
  const attempts = failedAttemptsMap.get(ip) || [];
  attempts.push(Date.now());
  failedAttemptsMap.set(ip, attempts);
}

export function clearFailedAttempts(ip: string): void {
  failedAttemptsMap.delete(ip);
}
