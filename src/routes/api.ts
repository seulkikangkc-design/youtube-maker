// Analysis and video routes
import { Hono } from 'hono'
import type { Bindings, AnalysisResult, User, VideoLog } from '../types'
import { authMiddleware, type AuthContext } from '../middleware/auth'
import { analyzeYouTubeCompetition } from '../services/youtube'
import { analyzeWithGemini } from '../services/gemini'
import { getTrendingKeywords } from '../services/trending'
import { generateVideo } from '../services/video'
// Note: Image/Video generation via Gemini API is not yet available
// import { generateImage, generateVideo as generateMediaVideo } from '../services/media-generation'

const api = new Hono<{ Bindings: Bindings }>()

// GET /api/trending - Get trending keywords (requires auth)
api.get('/trending', authMiddleware, async (c) => {
  try {
    const count = parseInt(c.req.query('count') || '10')
    const keywords = await getTrendingKeywords(c.env.YOUTUBE_API_KEY, count)
    
    return c.json({ keywords })
  } catch (error) {
    console.error('Trending keywords error:', error)
    return c.json({ 
      error: 'Failed to fetch trending keywords' 
    }, 500)
  }
})
// POST /api/analyze - Analyze keyword (no credit deduction)
api.post('/analyze', authMiddleware, async (c) => {
  const authContext = c as AuthContext;
  const userPayload = authContext.get('user');
  
  try {
    const { keyword } = await c.req.json();
    
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return c.json({ error: 'Keyword is required' }, 400);
    }
    
    // Analyze with YouTube API
    const youtubeAnalysis = await analyzeYouTubeCompetition(
      keyword.trim(),
      c.env.YOUTUBE_API_KEY
    );
    
    // Analyze with Gemini API
    const geminiAnalysis = await analyzeWithGemini(
      keyword.trim(),
      youtubeAnalysis,
      c.env.GEMINI_API_KEY
    );
    
    const result: AnalysisResult = {
      youtube: youtubeAnalysis,
      gemini: geminiAnalysis
    };
    
    return c.json({
      keyword: keyword.trim(),
      analysis: result
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({ 
      error: 'Failed to analyze keyword. Please try again.' 
    }, 500);
  }
})

// POST /api/video/create - Create video (deducts credits)
api.post('/video/create', authMiddleware, async (c) => {
  const authContext = c as AuthContext;
  const userPayload = authContext.get('user');
  
  try {
    const { keyword, analysis } = await c.req.json();
    
    if (!keyword || !analysis) {
      return c.json({ error: 'Keyword and analysis are required' }, 400);
    }
    
    // Get current user data
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userPayload.userId).first() as User | null;
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check credits
    if (user.credits < 100) {
      return c.json({ 
        error: 'Insufficient credits. You need at least 100 credits to create a video.' 
      }, 400);
    }
    
    // Check video limit
    if (user.videos_created >= 10) {
      return c.json({ 
        error: 'Video limit reached. Maximum 10 videos per account.' 
      }, 400);
    }
    
    // Generate video
    const videoResult = await generateVideo(keyword, analysis);
    
    // Prepare extended analysis result with video URLs
    const extendedAnalysis = {
      ...analysis,
      video: videoResult
    };
    
    // ATOMIC TRANSACTION: Deduct credits and create video log
    // Using D1's batch API for atomic operations
    const statements = [
      // Deduct 100 credits from user
      c.env.DB.prepare(
        'UPDATE users SET credits = credits - 100, videos_created = videos_created + 1 WHERE id = ?'
      ).bind(userPayload.userId),
      
      // Create credit log
      c.env.DB.prepare(`
        INSERT INTO credit_logs (user_id, change_amount, reason)
        VALUES (?, -100, ?)
      `).bind(userPayload.userId, `Video creation for keyword: ${keyword}`),
      
      // Create video log with video URLs
      c.env.DB.prepare(`
        INSERT INTO video_logs (user_id, keyword, credits_used, status, analysis_result)
        VALUES (?, ?, 100, 'completed', ?)
      `).bind(userPayload.userId, keyword, JSON.stringify(extendedAnalysis))
    ];
    
    const results = await c.env.DB.batch(statements);
    
    // Check if all operations succeeded
    const allSucceeded = results.every(r => r.success);
    
    if (!allSucceeded) {
      return c.json({ 
        error: 'Failed to create video. Credits were not deducted.' 
      }, 500);
    }
    
    // Get the created video log ID
    const videoLogId = results[2].meta.last_row_id;
    
    // Get updated user data
    const updatedUser = await c.env.DB.prepare(
      'SELECT credits, videos_created FROM users WHERE id = ?'
    ).bind(userPayload.userId).first() as Pick<User, 'credits' | 'videos_created'>;
    
    return c.json({
      success: true,
      videoLogId,
      video: videoResult,
      creditsRemaining: updatedUser.credits,
      videosCreated: updatedUser.videos_created,
      message: 'Video created successfully! 100 credits deducted.'
    });
    
  } catch (error) {
    console.error('Video creation error:', error);
    return c.json({ 
      error: 'Failed to create video. Please try again.' 
    }, 500);
  }
})

// GET /api/videos - Get user's video history
api.get('/videos', authMiddleware, async (c) => {
  const authContext = c as AuthContext;
  const userPayload = authContext.get('user');
  
  try {
    const videos = await c.env.DB.prepare(`
      SELECT * FROM video_logs 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userPayload.userId).all() as { results: VideoLog[] };
    
    return c.json({ videos: videos.results });
    
  } catch (error) {
    console.error('Get videos error:', error);
    return c.json({ error: 'Failed to retrieve videos' }, 500);
  }
})

// Note: Image/Video generation endpoints are disabled
// Gemini API does not support Imagen or Veo models via public API yet
/*
// POST /api/media/image - Generate image using Gemini Imagen 3
api.post('/media/image', authMiddleware, async (c) => {
  return c.json({ 
    error: 'Image generation is not yet available. Coming soon!' 
  }, 501);
})

// POST /api/media/video - Generate video using Gemini Veo 2
api.post('/media/video', authMiddleware, async (c) => {
  return c.json({ 
    error: 'Video generation is not yet available. Coming soon!' 
  }, 501);
})
*/

// GET /api/credits - Get user's credit info
api.get('/credits', authMiddleware, async (c) => {
  const authContext = c as AuthContext;
  const userPayload = authContext.get('user');
  
  try {
    const user = await c.env.DB.prepare(
      'SELECT credits, videos_created FROM users WHERE id = ?'
    ).bind(userPayload.userId).first() as Pick<User, 'credits' | 'videos_created'> | null;
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      credits: user.credits,
      videosCreated: user.videos_created,
      canCreateVideo: user.credits >= 100 && user.videos_created < 10
    });
    
  } catch (error) {
    console.error('Get credits error:', error);
    return c.json({ error: 'Failed to retrieve credits' }, 500);
  }
})

export default api
