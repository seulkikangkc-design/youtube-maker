// YouTube API service
// Analyzes competition and engagement metrics for a keyword

type YouTubeSearchResponse = {
  pageInfo: {
    totalResults: number;
  };
  items: Array<{
    id: {
      videoId: string;
    };
  }>;
}

type YouTubeVideoResponse = {
  items: Array<{
    statistics: {
      viewCount: string;
    };
    snippet: {
      publishedAt: string;
    };
  }>;
}

export type YouTubeAnalysis = {
  totalResults: number;
  avgViews: number;
  recentVideos: number; // videos published in last 30 days
}

export async function analyzeYouTubeCompetition(
  keyword: string,
  apiKey: string
): Promise<YouTubeAnalysis> {
  try {
    // Step 1: Search for videos with the keyword
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'id');
    searchUrl.searchParams.set('q', keyword);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', '50');
    searchUrl.searchParams.set('key', apiKey);
    
    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json() as YouTubeSearchResponse;
    const totalResults = searchData.pageInfo.totalResults;
    
    // If no results, return early
    if (!searchData.items || searchData.items.length === 0) {
      return {
        totalResults: 0,
        avgViews: 0,
        recentVideos: 0
      };
    }
    
    // Step 2: Get video details (views, publish date)
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('part', 'statistics,snippet');
    videosUrl.searchParams.set('id', videoIds);
    videosUrl.searchParams.set('key', apiKey);
    
    const videosResponse = await fetch(videosUrl.toString());
    
    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.status}`);
    }
    
    const videosData = await videosResponse.json() as YouTubeVideoResponse;
    
    // Calculate metrics
    let totalViews = 0;
    let recentVideos = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const video of videosData.items) {
      const views = parseInt(video.statistics.viewCount || '0');
      totalViews += views;
      
      const publishedAt = new Date(video.snippet.publishedAt);
      if (publishedAt > thirtyDaysAgo) {
        recentVideos++;
      }
    }
    
    const avgViews = videosData.items.length > 0 
      ? Math.round(totalViews / videosData.items.length)
      : 0;
    
    return {
      totalResults,
      avgViews,
      recentVideos
    };
    
  } catch (error) {
    console.error('YouTube API error:', error);
    throw error;
  }
}
