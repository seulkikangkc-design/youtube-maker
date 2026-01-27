// Gemini API service
// Analyzes whether a product keyword is worth creating a video for

import type { YouTubeAnalysis } from './youtube'

export type GeminiAnalysis = {
  worthCreating: boolean;
  reasoning: string;
  videoConcepts: string[];
  hookLine: string;
}

type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function analyzeWithGemini(
  keyword: string,
  youtubeData: YouTubeAnalysis,
  apiKey: string
): Promise<GeminiAnalysis> {
  try {
    const prompt = `You are evaluating whether a product keyword is worth creating a short-form introduction video for.

Input:
- Keyword: "${keyword}"
- Total YouTube search results: ${youtubeData.totalResults}
- Average views of existing videos: ${youtubeData.avgViews}
- Videos published in last 30 days: ${youtubeData.recentVideos}
- Target platform: YouTube Shorts, TikTok, Instagram Reels

Analyze this data and provide:
1. A clear YES or NO on whether it's worth creating a video
2. Your reasoning (consider competition level, audience demand, and market saturation)
3. Three specific video concept ideas (if worthwhile)
4. A compelling hook line for the first 3 seconds (if worthwhile)

Return your answer in this exact JSON format:
{
  "worthCreating": true or false,
  "reasoning": "your detailed reasoning here",
  "videoConcepts": ["concept 1", "concept 2", "concept 3"],
  "hookLine": "your hook line here"
}

If not worth creating, provide empty array for videoConcepts and empty string for hookLine.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as GeminiResponse;
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    
    // Remove markdown code blocks
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    jsonText = jsonText.trim();
    
    // Find the first { and last }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No valid JSON found in Gemini response');
    }
    
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    
    const analysis = JSON.parse(jsonText) as GeminiAnalysis;
    
    // Validate response structure
    if (typeof analysis.worthCreating !== 'boolean') {
      throw new Error('Invalid Gemini response format');
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Fallback response in case of error
    return {
      worthCreating: false,
      reasoning: 'Unable to analyze due to API error. Please try again.',
      videoConcepts: [],
      hookLine: ''
    };
  }
}
