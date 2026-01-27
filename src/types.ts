// Type definitions for Cloudflare environment bindings
export type Bindings = {
  DB: D1Database;
  YOUTUBE_API_KEY: string;
  GEMINI_API_KEY: string;
  VERTEX_AI_API_KEY: string;
  VERTEX_AI_PROJECT_ID: string;
  JWT_SECRET: string;
}

// User types
export type User = {
  id: number;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  credits: number;
  videos_created: number;
  created_at: string;
  last_login_at: string | null;
}

export type SafeUser = Omit<User, 'password_hash'>

// VideoLog types
export type VideoLog = {
  id: number;
  user_id: number;
  keyword: string;
  credits_used: number;
  status: 'processing' | 'completed' | 'failed';
  analysis_result: string | null;
  created_at: string;
}

export type AnalysisResult = {
  youtube: {
    totalResults: number;
    avgViews: number;
    recentVideos: number;
  };
  gemini: {
    worthCreating: boolean;
    reasoning: string;
    videoConcepts: string[];
    hookLine: string;
  };
}

// CreditLog types
export type CreditLog = {
  id: number;
  user_id: number;
  change_amount: number;
  reason: string;
  admin_id: number | null;
  created_at: string;
}

// JWT payload
export type JWTPayload = {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}
