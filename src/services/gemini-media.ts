// Gemini API for Image and Video Generation
export interface GeminiMediaResult {
  imageUrl?: string;
  videoUrl?: string;
  prompt: string;
  model: string;
}

/**
 * Generate an image using Gemini API (Imagen 3)
 * Uses the same Gemini API key as text generation
 */
export async function generateImageWithGemini(
  prompt: string,
  apiKey: string
): Promise<GeminiMediaResult> {
  console.log('🎨 Generating image with Gemini Imagen...');
  console.log('Prompt:', prompt.substring(0, 100));

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Imagen error:', response.status, errorText);
      
      // Fallback to placeholder
      console.warn('⚠️ Using placeholder image');
      const width = 1920;
      const height = 1080;
      return {
        imageUrl: `https://placehold.co/${width}x${height}/4F46E5/white?text=${encodeURIComponent(prompt.substring(0, 30))}`,
        prompt,
        model: 'placeholder (Imagen not available)'
      };
    }

    const data = await response.json();
    
    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      const imageUrl = `data:image/png;base64,${base64Image}`;
      
      console.log('✅ Image generated successfully');
      
      return {
        imageUrl,
        prompt,
        model: 'imagen-3.0-generate-001'
      };
    }
    
    throw new Error('No image data in response');
    
  } catch (error) {
    console.error('Gemini image generation error:', error);
    
    // Fallback to placeholder
    const width = 1920;
    const height = 1080;
    return {
      imageUrl: `https://placehold.co/${width}x${height}/4F46E5/white?text=${encodeURIComponent(prompt.substring(0, 30))}`,
      prompt,
      model: 'placeholder (error)'
    };
  }
}

/**
 * Generate a video using Gemini API (Veo)
 * Note: Veo might require special access
 */
export async function generateVideoWithGemini(
  prompt: string,
  apiKey: string
): Promise<GeminiMediaResult> {
  console.log('🎬 Generating video with Gemini Veo...');
  console.log('Prompt:', prompt.substring(0, 100));

  // Try multiple Veo endpoints
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/video-generation@001:predict?key=${apiKey}`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check for video data
        if (data.candidates?.[0]?.content?.parts?.[0]?.videoUrl) {
          const videoUrl = data.candidates[0].content.parts[0].videoUrl;
          console.log('✅ Video generated successfully');
          
          return {
            videoUrl,
            prompt,
            model: 'veo-001'
          };
        }
      }
      
      console.warn(`Endpoint ${endpoint} failed, trying next...`);
      
    } catch (error) {
      console.error(`Error with endpoint ${endpoint}:`, error);
    }
  }

  // All endpoints failed - return sample video
  console.warn('⚠️ Veo not accessible, using sample video');
  
  const sampleVideos = [
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  ];
  
  const videoUrl = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
  
  return {
    videoUrl,
    prompt,
    model: 'sample (Veo requires special access)'
  };
}
