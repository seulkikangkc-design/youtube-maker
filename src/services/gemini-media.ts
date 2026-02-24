// Google AI Studio API for Image and Video Generation
// Uses Gemini's multimodal capabilities
export interface GeminiMediaResult {
  imageUrl?: string;
  videoUrl?: string;
  prompt: string;
  model: string;
}

/**
 * Generate an image using Google AI Studio (Imagen)
 */
export async function generateImageWithGemini(
  prompt: string,
  apiKey: string
): Promise<GeminiMediaResult> {
  console.log('🎨 Generating image with Google AI Studio...');
  console.log('Prompt:', prompt.substring(0, 100));

  // Try Imagen via Google AI Studio
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/imagegeneration@006:predict?key=${apiKey}`,
  ];

  for (const endpoint of endpoints) {
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
            aspectRatio: '16:9',
            negativePrompt: 'blurry, low quality',
            addWatermark: false
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.predictions?.[0]?.bytesBase64Encoded) {
          const base64Image = data.predictions[0].bytesBase64Encoded;
          const imageUrl = `data:image/png;base64,${base64Image}`;
          
          console.log('✅ Image generated successfully');
          
          return {
            imageUrl,
            prompt,
            model: 'Google AI Studio Imagen'
          };
        }
      }
      
      console.warn(`Endpoint ${endpoint} failed, trying next...`);
      
    } catch (error) {
      console.error(`Error with endpoint ${endpoint}:`, error);
    }
  }

  // All endpoints failed - return placeholder
  console.warn('⚠️ Imagen not accessible, using placeholder');
  const width = 1920;
  const height = 1080;
  
  return {
    imageUrl: `https://placehold.co/${width}x${height}/4F46E5/white?text=${encodeURIComponent(prompt.substring(0, 30))}`,
    prompt,
    model: 'placeholder'
  };
}

/**
 * Generate a video using Google AI Studio (Veo)
 */
export async function generateVideoWithGemini(
  prompt: string,
  apiKey: string
): Promise<GeminiMediaResult> {
  console.log('🎬 Generating video with Google AI Studio...');
  console.log('Prompt:', prompt.substring(0, 100));

  // Try multiple Veo endpoints
  const endpoints = [
    // Veo 2 endpoint
    {
      url: `https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateContent?key=${apiKey}`,
      body: {
        contents: [{
          parts: [{
            text: `Generate a 5-second vertical video (9:16 aspect ratio) for YouTube Shorts: ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95
        }
      }
    },
    // Alternative video generation endpoint
    {
      url: `https://generativelanguage.googleapis.com/v1beta/models/video-generation@001:predict?key=${apiKey}`,
      body: {
        instances: [{
          prompt: prompt,
          duration: 5,
          aspectRatio: '9:16'
        }],
        parameters: {
          sampleCount: 1
        }
      }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint.url.split('?')[0]}`);
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endpoint.body)
      });

      const data = await response.json();
      
      if (response.ok) {
        // Check for video URL in response
        const videoUrl = 
          data.candidates?.[0]?.content?.parts?.[0]?.videoData?.videoUrl ||
          data.candidates?.[0]?.content?.parts?.[0]?.videoUrl ||
          data.predictions?.[0]?.videoUri ||
          data.predictions?.[0]?.bytesBase64Encoded;
        
        if (videoUrl) {
          console.log('✅ Video generated successfully');
          
          // If base64, convert to data URL
          if (videoUrl.startsWith('data:') || videoUrl.startsWith('http')) {
            return {
              videoUrl,
              prompt,
              model: 'Google AI Studio Veo'
            };
          } else {
            return {
              videoUrl: `data:video/mp4;base64,${videoUrl}`,
              prompt,
              model: 'Google AI Studio Veo'
            };
          }
        }
      }
      
      console.warn(`Endpoint response:`, response.status, JSON.stringify(data).substring(0, 200));
      
    } catch (error) {
      console.error(`Error with endpoint:`, error);
    }
  }

  // All endpoints failed - return sample video
  console.warn('⚠️ Veo not yet available with this API key, using sample video');
  console.warn('Note: Video generation may require Vertex AI or special access');
  
  const sampleVideos = [
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  ];
  
  const videoUrl = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
  
  return {
    videoUrl,
    prompt,
    model: 'sample (Veo requires special access)'
  };
}
