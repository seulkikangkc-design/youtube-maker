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
  // Retry logic for 503 errors (API overload)
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Gemini API attempt ${attempt}/${maxRetries}`);
      
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
        
        // Check if it's a 503 (overloaded) error - retry
        if (response.status === 503 && attempt < maxRetries) {
          const waitTime = attempt * 2000; // 2s, 4s
          console.log(`⏳ Model overloaded, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = new Error(`503 Service Unavailable - attempt ${attempt}`);
          continue; // Retry
        }
        
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
      
      console.log('✅ Gemini analysis successful');
      return analysis;
      
    } catch (error) {
      console.error(`❌ Gemini API error (attempt ${attempt}):`, error);
      lastError = error as Error;
      
      // If not the last attempt and it's a retryable error, continue
      if (attempt < maxRetries && error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('503') || errorMsg.includes('overload') || errorMsg.includes('unavailable')) {
          const waitTime = attempt * 2000;
          console.log(`⏳ Retrying after ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // Last attempt or non-retryable error - break
      break;
    }
  }
  
  // All retries failed
  console.error('❌ All retry attempts exhausted');
  
  // Fallback response in case of error
  return {
    worthCreating: false,
    reasoning: 'Unable to analyze due to API error. Please try again.',
    videoConcepts: [],
    hookLine: ''
  };
}
