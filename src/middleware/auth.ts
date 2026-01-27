// Authentication middleware
import type { Context, Next } from 'hono'
import type { Bindings, JWTPayload } from '../types'
import { verifyJWT } from '../utils/jwt'

// Extend Context to include user info
export type AuthContext = Context<{ Bindings: Bindings }> & {
  get(key: 'user'): JWTPayload;
  set(key: 'user', value: JWTPayload): void;
}

export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  c.set('user', payload);
  await next();
}

export async function adminMiddleware(c: AuthContext, next: Next) {
  const user = c.get('user');
  
  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  
  await next();
}
