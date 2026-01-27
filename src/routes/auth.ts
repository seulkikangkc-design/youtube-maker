// Authentication routes
import { Hono } from 'hono'
import type { Bindings, User, SafeUser } from '../types'
import { hashPassword, verifyPassword } from '../utils/crypto'
import { signJWT } from '../utils/jwt'
import { authMiddleware, type AuthContext } from '../middleware/auth'

const auth = new Hono<{ Bindings: Bindings }>()

// Helper function to convert User to SafeUser
function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// POST /auth/signup - Register new user
auth.post('/signup', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }
    
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 409);
    }
    
    // Hash password
    const password_hash = await hashPassword(password);
    
    // Create user with default values
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, password_hash, role, credits, videos_created)
      VALUES (?, ?, 'user', 1000, 0)
    `).bind(email, password_hash).run();
    
    if (!result.success) {
      return c.json({ error: 'Failed to create user' }, 500);
    }
    
    // Get the created user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(result.meta.last_row_id).first() as User;
    
    // Generate JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    }, c.env.JWT_SECRET);
    
    return c.json({
      token,
      user: toSafeUser(user)
    }, 201);
    
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
})

// POST /auth/login - Login user
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Get user from database
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first() as User | null;
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Update last login time
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    // Generate JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    }, c.env.JWT_SECRET);
    
    return c.json({
      token,
      user: toSafeUser(user)
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
})

// GET /auth/me - Get current user info (requires authentication)
auth.get('/me', authMiddleware, async (c) => {
  const authContext = c as AuthContext;
  const userPayload = authContext.get('user');
  
  // Get fresh user data from database
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userPayload.userId).first() as User | null;
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ user: toSafeUser(user) });
})

export default auth
