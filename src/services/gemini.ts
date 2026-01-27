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
    const prompt = `Evaluate whether to create a short video for this keyword. Return ONLY valid JSON, no other text.

Keyword: "${keyword}"
YouTube search results: ${youtubeData.totalResults}
Average views: ${youtubeData.avgViews}
Recent videos (30 days): ${youtubeData.recentVideos}

Return this exact JSON structure:
{
  "worthCreating": true,
  "reasoning": "detailed analysis of competition and opportunity",
  "videoConcepts": ["concept 1", "concept 2", "concept 3"],
  "hookLine": "compelling 3-second hook"
}

If not worth creating, set worthCreating to false, videoConcepts to [], hookLine to "".
IMPORTANT: Return ONLY the JSON object, no markdown, no explanation.`;

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
          responseMimeType: "application/json"
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
    
    console.log('Gemini raw response length:', text.length);
    console.log('Gemini raw response:', text.substring(0, 300));
    
    // With responseMimeType: "application/json", Gemini returns pure JSON
    const analysis = JSON.parse(text) as GeminiAnalysis;
    
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
