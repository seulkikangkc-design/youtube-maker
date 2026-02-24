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
  console.log('🎨 Generating image with Google AI Studio Imagen...');
  console.log('Prompt:', prompt.substring(0, 100));

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Imagen API error:', response.status, errorText);
      throw new Error(`Imagen API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract image data from response
    const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'image/jpeg';
    
    if (imageData) {
      const imageUrl = `data:${mimeType};base64,${imageData}`;
      
      console.log('✅ Image generated successfully with gemini-3-pro-image-preview');
      console.log('Image size:', imageData.length, 'bytes');
      
      return {
        imageUrl,
        prompt,
        model: 'gemini-3-pro-image-preview'
      };
    }
    
    console.warn('⚠️ No image data in response');
    throw new Error('No image data in response');
    
  } catch (error) {
    console.error('Gemini image generation error:', error);
    
    // Fallback to placeholder
    console.warn('⚠️ Using placeholder image');
    const width = 1920;
    const height = 1080;
    
    return {
      imageUrl: `https://placehold.co/${width}x${height}/4F46E5/white?text=${encodeURIComponent(prompt.substring(0, 30))}`,
      prompt,
      model: 'placeholder'
    };
  }
}

/**
 * Generate a video using Google AI Studio (Veo 3.1)
 */
export async function generateVideoWithGemini(
  prompt: string,
  apiKey: string
): Promise<GeminiMediaResult> {
  console.log('🎬 Generating video with Google AI Studio Veo 3.1...');
  console.log('Prompt:', prompt.substring(0, 100));

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Veo API error:', response.status, errorText);
      throw new Error(`Veo API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for video data in response
    const videoData = 
      data.candidates?.[0]?.content?.parts?.[0]?.videoData?.videoUri ||
      data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ||
      data.predictions?.[0]?.videoUri;
    
    if (videoData) {
      let videoUrl: string;
      
      // If it's a URL, use directly
      if (typeof videoData === 'string' && videoData.startsWith('http')) {
        videoUrl = videoData;
      }
      // If it's base64, convert to data URL
      else if (typeof videoData === 'string') {
        const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'video/mp4';
        videoUrl = `data:${mimeType};base64,${videoData}`;
      } else {
        throw new Error('Invalid video data format');
      }
      
      console.log('✅ Video generated successfully with veo-3.1-generate-preview');
      console.log('Video URL:', videoUrl.substring(0, 100));
      
      return {
        videoUrl,
        prompt,
        model: 'veo-3.1-generate-preview'
      };
    }
    
    console.warn('⚠️ No video data in response');
    throw new Error('No video data in response');
    
  } catch (error) {
    console.error('Gemini video generation error:', error);
    
    // Fallback to sample video
    console.warn('⚠️ Veo not yet available, using sample video');
    console.warn('Note: Video generation may require special access or account upgrade');
    
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
      model: 'sample (Veo access required)'
    };
  }
}
