// Simple in-memory rate limiter for edge functions
// For production, consider using Redis or Supabase Edge Functions KV

const rateLimiter = new Map<string, number[]>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userRequests = rateLimiter.get(identifier) || [];
  
  // Filter out old requests outside the time window
  const recentRequests = userRequests.filter((time) => now - time < config.windowMs);
  
  if (recentRequests.length >= config.maxRequests) {
    const oldestRequest = Math.min(...recentRequests);
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  recentRequests.push(now);
  rateLimiter.set(identifier, recentRequests);
  
  // Clean up old entries periodically (simple GC)
  if (Math.random() < 0.01) {
    cleanupOldEntries(config.windowMs);
  }
  
  return { allowed: true };
}

function cleanupOldEntries(windowMs: number) {
  const now = Date.now();
  for (const [key, requests] of rateLimiter.entries()) {
    const recentRequests = requests.filter((time) => now - time < windowMs);
    if (recentRequests.length === 0) {
      rateLimiter.delete(key);
    } else {
      rateLimiter.set(key, recentRequests);
    }
  }
}

export function getClientIdentifier(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
}
