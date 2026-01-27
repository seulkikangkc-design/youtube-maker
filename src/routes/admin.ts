// Admin routes
import { Hono } from 'hono'
import type { Bindings, User, SafeUser } from '../types'
import { authMiddleware, adminMiddleware, type AuthContext } from '../middleware/auth'

const admin = new Hono<{ Bindings: Bindings }>()

// Apply both auth and admin middleware to all routes
admin.use('/*', authMiddleware, adminMiddleware)

// Helper function to convert User to SafeUser
function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// GET /admin/users - Get all users
admin.get('/users', async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT * FROM users ORDER BY created_at DESC
    `).all() as { results: User[] };
    
    const safeUsers = users.results.map(toSafeUser);
    
    return c.json({ users: safeUsers });
    
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to retrieve users' }, 500);
  }
})

// GET /admin/users/:id - Get specific user
admin.get('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    
    if (isNaN(userId)) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first() as User | null;
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user: toSafeUser(user) });
    
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to retrieve user' }, 500);
  }
})

// POST /admin/credits/update - Adjust user credits
admin.post('/credits/update', async (c) => {
  const authContext = c as AuthContext;
  const adminPayload = authContext.get('user');
  
  try {
    const { userId, amount, reason } = await c.req.json();
    
    if (!userId || amount === undefined || !reason) {
      return c.json({ 
        error: 'userId, amount, and reason are required' 
      }, 400);
    }
    
    if (typeof amount !== 'number' || amount === 0) {
      return c.json({ error: 'Amount must be a non-zero number' }, 400);
    }
    
    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id, credits FROM users WHERE id = ?'
    ).bind(userId).first() as Pick<User, 'id' | 'credits'> | null;
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check if deduction would result in negative credits
    if (amount < 0 && user.credits + amount < 0) {
      return c.json({ 
        error: 'Cannot deduct more credits than user has' 
      }, 400);
    }
    
    // ATOMIC TRANSACTION: Update credits and log change
    const statements = [
      // Update user credits
      c.env.DB.prepare(
        'UPDATE users SET credits = credits + ? WHERE id = ?'
      ).bind(amount, userId),
      
      // Create credit log
      c.env.DB.prepare(`
        INSERT INTO credit_logs (user_id, change_amount, reason, admin_id)
        VALUES (?, ?, ?, ?)
      `).bind(userId, amount, reason, adminPayload.userId)
    ];
    
    const results = await c.env.DB.batch(statements);
    
    // Check if all operations succeeded
    const allSucceeded = results.every(r => r.success);
    
    if (!allSucceeded) {
      return c.json({ 
        error: 'Failed to update credits' 
      }, 500);
    }
    
    // Get updated user data
    const updatedUser = await c.env.DB.prepare(
      'SELECT credits FROM users WHERE id = ?'
    ).bind(userId).first() as Pick<User, 'credits'>;
    
    return c.json({
      success: true,
      newCredits: updatedUser.credits,
      message: `Credits ${amount > 0 ? 'added' : 'deducted'} successfully`
    });
    
  } catch (error) {
    console.error('Update credits error:', error);
    return c.json({ error: 'Failed to update credits' }, 500);
  }
})

// POST /admin/user/role - Change user role
admin.post('/user/role', async (c) => {
  const authContext = c as AuthContext;
  const adminPayload = authContext.get('user');
  
  try {
    const { userId, role } = await c.req.json();
    
    if (!userId || !role) {
      return c.json({ error: 'userId and role are required' }, 400);
    }
    
    if (role !== 'user' && role !== 'admin') {
      return c.json({ error: 'Role must be "user" or "admin"' }, 400);
    }
    
    // Cannot change own role
    if (userId === adminPayload.userId) {
      return c.json({ error: 'Cannot change your own role' }, 400);
    }
    
    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Update role
    const result = await c.env.DB.prepare(
      'UPDATE users SET role = ? WHERE id = ?'
    ).bind(role, userId).run();
    
    if (!result.success) {
      return c.json({ error: 'Failed to update role' }, 500);
    }
    
    return c.json({
      success: true,
      message: `User role updated to ${role}`
    });
    
  } catch (error) {
    console.error('Update role error:', error);
    return c.json({ error: 'Failed to update role' }, 500);
  }
})

// GET /admin/credit-logs - Get all credit logs
admin.get('/credit-logs', async (c) => {
  try {
    const logs = await c.env.DB.prepare(`
      SELECT 
        cl.*,
        u.email as user_email,
        a.email as admin_email
      FROM credit_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      LEFT JOIN users a ON cl.admin_id = a.id
      ORDER BY cl.created_at DESC
      LIMIT 100
    `).all();
    
    return c.json({ logs: logs.results });
    
  } catch (error) {
    console.error('Get credit logs error:', error);
    return c.json({ error: 'Failed to retrieve credit logs' }, 500);
  }
})

export default admin
