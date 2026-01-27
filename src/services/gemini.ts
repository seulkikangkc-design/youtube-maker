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
    const prompt = `Evaluate whether to create a short video for this keyword.
    
Keyword: "${keyword}"
YouTube search results: ${youtubeData.totalResults}
Average views: ${youtubeData.avgViews}
Recent videos (30 days): ${youtubeData.recentVideos}

Analyze the competition and opportunity.
If not worth creating, set worthCreating to false, videoConcepts to [], hookLine to "".`;

    // Use gemini-2.5-flash (verified as available model)
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
          responseMimeType: "application/json",
          // Explicit schema definition for guaranteed structure
          responseSchema: {
            type: "OBJECT",
            properties: {
              worthCreating: { type: "BOOLEAN" },
              reasoning: { type: "STRING" },
              videoConcepts: { 
                type: "ARRAY",
                items: { type: "STRING" }
              },
              hookLine: { type: "STRING" }
            },
            required: ["worthCreating", "reasoning", "videoConcepts", "hookLine"]
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Gemini HTTP status:', response.status);
      console.error('❌ Gemini error body:', errText);
      console.error('❌ Request URL:', url.replace(apiKey, 'HIDDEN'));
      throw new Error(`Gemini API error: ${response.status} - ${errText.substring(0, 200)}`);
    }

    const data = await response.json() as GeminiResponse;
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    let text = data.candidates[0].content.parts[0].text;
    
    // Safety: Remove markdown code blocks if present
    // Handles: ```json { ... } ``` or ``` { ... } ```
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    console.log('Gemini raw response:', text.substring(0, 100) + '...');
    
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
