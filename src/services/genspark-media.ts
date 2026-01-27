// GenSpark Video and Image Generation API
export interface GenSparkVideoResult {
  videoUrl: string;
  prompt: string;
  model: string;
  duration: number;
}

export interface GenSparkImageResult {
  imageUrl: string;
  prompt: string;
  model: string;
}

/**
 * Generate a video using GenSpark Video Generation API
 * Supports multiple models: kling, veo3, sora-2, runway, etc.
 */
export async function generateVideoWithGenSpark(
  prompt: string,
  apiKey: string
): Promise<GenSparkVideoResult> {
  console.log('🎬 Generating video with GenSpark API...');
  console.log('Prompt:', prompt.substring(0, 100));

  const endpoint = 'https://api.genspark.ai/v1/video/generate';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: prompt,
        model: 'kling/v2.6/pro', // Latest high-quality model
        aspect_ratio: '9:16', // Vertical for Shorts
        duration: 5, // 5 seconds
        task_summary: 'Generate short video for YouTube Shorts'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GenSpark API error status:', response.status);
      console.error('GenSpark API error body:', errorText);
      throw new Error(`GenSpark Video API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Video generated successfully');
    
    // GenSpark API response structure
    return {
      videoUrl: data.video_url || data.url || data.result?.url,
      prompt,
      model: 'kling/v2.6/pro',
      duration: 5
    };
  } catch (error) {
    console.error('GenSpark video generation error:', error);
    throw error;
  }
}

/**
 * Generate an image using GenSpark Image Generation API
 * Supports multiple models: flux-pro, ideogram, imagen, etc.
 */
export async function generateImageWithGenSpark(
  prompt: string,
  apiKey: string
): Promise<GenSparkImageResult> {
  console.log('🎨 Generating image with GenSpark API...');
  console.log('Prompt:', prompt.substring(0, 100));

  const endpoint = 'https://api.genspark.ai/v1/image/generate';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: prompt,
        model: 'fal-ai/flux-2-pro', // High-quality image model
        aspect_ratio: '16:9', // Good for thumbnails
        task_summary: 'Generate thumbnail image for YouTube video'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GenSpark API error status:', response.status);
      console.error('GenSpark API error body:', errorText);
      throw new Error(`GenSpark Image API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Image generated successfully');
    
    // GenSpark API response structure
    return {
      imageUrl: data.image_url || data.url || data.result?.url,
      prompt,
      model: 'fal-ai/flux-2-pro'
    };
  } catch (error) {
    console.error('GenSpark image generation error:', error);
    throw error;
  }
}
