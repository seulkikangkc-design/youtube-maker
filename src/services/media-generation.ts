// Gemini Media Generation Service
// Image: Imagen 3
// Video: Veo 2

export type ImageGenerationResult = {
  imageUrl: string;
  thumbnailUrl: string;
}

export type VideoGenerationResult = {
  videoUrl: string;
  thumbnailUrl: string;
}

/**
 * Generate image using Gemini Imagen 3
 * Model: imagen-3.0-generate-001
 */
export async function generateImage(
  prompt: string,
  apiKey: string
): Promise<ImageGenerationResult> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{
          prompt: prompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
          safetyFilterLevel: "block_some",
          personGeneration: "allow_adult"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Imagen API status:', response.status);
      console.error('❌ Imagen error body:', errText);
      throw new Error(`Imagen API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract base64 image
    const imageBase64 = data.predictions[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    return {
      imageUrl,
      thumbnailUrl: imageUrl // Same for now
    };
    
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

/**
 * Generate video using Gemini Veo 2
 * Model: veo-2.0-generate-001
 */
export async function generateVideo(
  prompt: string,
  apiKey: string
): Promise<VideoGenerationResult> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predict?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{
          prompt: prompt
        }],
        parameters: {
          aspectRatio: "9:16", // Vertical for shorts
          duration: "5s"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Veo API status:', response.status);
      console.error('❌ Veo error body:', errText);
      throw new Error(`Veo API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract base64 video
    const videoBase64 = data.predictions[0].bytesBase64Encoded;
    const videoUrl = `data:video/mp4;base64,${videoBase64}`;
    
    // For thumbnail, we'll use a placeholder or extract first frame
    const thumbnailUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
    
    return {
      videoUrl,
      thumbnailUrl
    };
    
  } catch (error) {
    console.error('Video generation error:', error);
    throw error;
  }
}
