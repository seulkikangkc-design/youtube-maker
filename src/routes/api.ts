// Analysis and video routes
import { Hono } from 'hono'
import type { Bindings, AnalysisResult, User, VideoLog } from '../types'
import { authMiddleware, type AuthContext } from '../middleware/auth'
import { analyzeYouTubeCompetition } from '../services/youtube'
import { analyzeWithGemini } from '../services/gemini'
import { getTrendingKeywords } from '../services/trending'
import { generateVideo } from '../services/video'
import { generateImage, generateVideo as generateVertexVideo } from '../services/vertexai'

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

// POST /api/media/image - Generate image using Vertex AI Imagen 3
api.post('/media/image', authMiddleware, async (c) => {
  const authContext = c as AuthContext;
  const userPayload = authContext.get('user');
  
  try {
    const { prompt } = await c.req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return c.json({ error: 'Prompt is required' }, 400);
    }
    
    // Get current user
    const user = await c.env.DB.prepare(
      'SELECT credits FROM users WHERE id = ?'
    ).bind(userPayload.userId).first() as Pick<User, 'credits'> | null;
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check credits (50 credits for image generation)
    if (user.credits < 50) {
      return c.json({ 
        error: 'Insufficient credits. You need at least 50 credits for image generation.' 
      }, 400);
    }
    
    console.log('🎨 Generating image for user:', userPayload.email);
    
    // Generate image using Vertex AI
    const imageResult = await generateImage(
      prompt,
      c.env.VERTEX_AI_API_KEY,
      c.env.VERTEX_AI_PROJECT_ID
    );
    
    // Deduct 50 credits
    const statements = [
      c.env.DB.prepare(
        'UPDATE users SET credits = credits - 50 WHERE id = ?'
      ).bind(userPayload.userId),
      
      c.env.DB.prepare(`
        INSERT INTO credit_logs (user_id, change_amount, reason)
        VALUES (?, -50, ?)
      `).bind(userPayload.userId, `Image generation: ${prompt.substring(0, 50)}...`)
    ];
    
    await c.env.DB.batch(statements);
    
    return c.json({
      success: true,
      image: imageResult,
      creditsDeducted: 50
    });
    
  } catch (error) {
    console.error('Image generation error:', error);
    return c.json({ 
      error: 'Failed to generate image. Please try again.' 
    }, 500);
  }
})

// POST /api/media/video - Generate video using Vertex AI Veo 2
api.post('/media/video', authMiddleware, async (c) => {
  const authContext = c as AuthContext;
  const userPayload = authContext.get('user');
  
  try {
    const { prompt } = await c.req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return c.json({ error: 'Prompt is required' }, 400);
    }
    
    // Get current user
    const user = await c.env.DB.prepare(
      'SELECT credits FROM users WHERE id = ?'
    ).bind(userPayload.userId).first() as Pick<User, 'credits'> | null;
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check credits (200 credits for video generation)
    if (user.credits < 200) {
      return c.json({ 
        error: 'Insufficient credits. You need at least 200 credits for video generation.' 
      }, 400);
    }
    
    console.log('🎬 Generating video for user:', userPayload.email);
    
    // Generate video using Vertex AI
    const videoResult = await generateVertexVideo(
      prompt,
      c.env.VERTEX_AI_API_KEY,
      c.env.VERTEX_AI_PROJECT_ID
    );
    
    // Deduct 200 credits
    const statements = [
      c.env.DB.prepare(
        'UPDATE users SET credits = credits - 200 WHERE id = ?'
      ).bind(userPayload.userId),
      
      c.env.DB.prepare(`
        INSERT INTO credit_logs (user_id, change_amount, reason)
        VALUES (?, -200, ?)
      `).bind(userPayload.userId, `Video generation: ${prompt.substring(0, 50)}...`)
    ];
    
    await c.env.DB.batch(statements);
    
    return c.json({
      success: true,
      video: videoResult,
      creditsDeducted: 200
    });
    
  } catch (error) {
    console.error('Video generation error:', error);
    return c.json({ 
      error: 'Failed to generate video. Please try again.' 
    }, 500);
  }
})

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
