// Trending keywords service using YouTube API

type YouTubeTrendingResponse = {
  items: Array<{
    snippet: {
      title: string;
      description: string;
      tags?: string[];
      categoryId: string;
    };
    statistics: {
      viewCount: string;
      likeCount: string;
    };
  }>;
}

export type TrendingKeyword = {
  keyword: string;
  category: string;
  estimatedViews: number;
  source: 'trending' | 'suggested';
}

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  '1': '영화/애니메이션',
  '2': '자동차/교통',
  '10': '음악',
  '15': '반려동물/동물',
  '17': '스포츠',
  '19': '여행/이벤트',
  '20': '게임',
  '22': '인물/블로그',
  '23': '코미디',
  '24': '엔터테인먼트',
  '25': '뉴스/정치',
  '26': '노하우/스타일',
  '27': '교육',
  '28': '과학/기술'
}

export async function getTrendingKeywords(
  apiKey: string,
  count: number = 10
): Promise<TrendingKeyword[]> {
  try {
    // Get trending videos from YouTube
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'snippet,statistics')
    url.searchParams.set('chart', 'mostPopular')
    url.searchParams.set('regionCode', 'KR')
    url.searchParams.set('maxResults', String(Math.min(count * 2, 50)))
    url.searchParams.set('key', apiKey)
    
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }
    
    const data = await response.json() as YouTubeTrendingResponse
    
    // Extract keywords from trending videos
    const keywords: TrendingKeyword[] = []
    const seenKeywords = new Set<string>()
    
    for (const video of data.items) {
      if (keywords.length >= count) break
      
      // Extract potential keywords from title
      const title = video.snippet.title
      const category = CATEGORY_MAP[video.snippet.categoryId] || '기타'
      const views = parseInt(video.statistics.viewCount || '0')
      
      // Extract main topic (first part of title before | or - )
      const mainTopic = title.split(/[|｜\-－—]/)[0].trim()
      
      // Skip if too short or already seen
      if (mainTopic.length < 3 || seenKeywords.has(mainTopic.toLowerCase())) {
        continue
      }
      
      seenKeywords.add(mainTopic.toLowerCase())
      
      keywords.push({
        keyword: mainTopic,
        category,
        estimatedViews: views,
        source: 'trending'
      })
    }
    
    // Add some suggested keywords if we don't have enough
    if (keywords.length < count) {
      const suggested = [
        { keyword: 'AI 도구 추천', category: '과학/기술', estimatedViews: 500000 },
        { keyword: '갤럭시 S25 리뷰', category: '과학/기술', estimatedViews: 800000 },
        { keyword: '다이어트 식단', category: '노하우/스타일', estimatedViews: 600000 },
        { keyword: '재택 부업', category: '교육', estimatedViews: 400000 },
        { keyword: '주식 투자 초보', category: '교육', estimatedViews: 700000 },
        { keyword: '운동 루틴', category: '스포츠', estimatedViews: 550000 },
        { keyword: '여행 브이로그', category: '여행/이벤트', estimatedViews: 650000 },
        { keyword: '반려동물 훈련', category: '반려동물/동물', estimatedViews: 450000 },
        { keyword: '요리 레시피', category: '노하우/스타일', estimatedViews: 500000 },
        { keyword: '영어 공부법', category: '교육', estimatedViews: 550000 }
      ]
      
      for (const s of suggested) {
        if (keywords.length >= count) break
        if (!seenKeywords.has(s.keyword.toLowerCase())) {
          keywords.push({ ...s, source: 'suggested' })
          seenKeywords.add(s.keyword.toLowerCase())
        }
      }
    }
    
    return keywords.slice(0, count)
    
  } catch (error) {
    console.error('Trending keywords error:', error)
    
    // Return fallback keywords on error
    return [
      { keyword: 'AI 도구 추천', category: '과학/기술', estimatedViews: 500000, source: 'suggested' },
      { keyword: '스마트폰 비교', category: '과학/기술', estimatedViews: 600000, source: 'suggested' },
      { keyword: '다이어트 팁', category: '노하우/스타일', estimatedViews: 700000, source: 'suggested' },
      { keyword: '재택 부업', category: '교육', estimatedViews: 400000, source: 'suggested' },
      { keyword: '주식 투자', category: '교육', estimatedViews: 800000, source: 'suggested' }
    ]
  }
}
