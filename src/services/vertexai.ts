// Vertex AI Imagen 3 and Veo 2 integration
export interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  model: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  prompt: string;
  model: string;
}

interface VertexAIImageResponse {
  predictions: Array<{
    bytesBase64Encoded: string;
    mimeType?: string;
  }>;
}

interface VertexAIVideoResponse {
  predictions: Array<{
    bytesBase64Encoded?: string;
    videoUri?: string;
  }>;
}

/**
 * Generate an image using Vertex AI Imagen 3
 */
export async function generateImage(
  prompt: string,
  apiKey: string,
  projectId: string
): Promise<ImageGenerationResult> {
  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;

  console.log('🎨 Generating image with Vertex AI Imagen 3...');
  console.log('Prompt:', prompt.substring(0, 100));

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9', // Good for thumbnails
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI Imagen error status:', response.status);
      console.error('Vertex AI Imagen error body:', errorText);
      throw new Error(`Vertex AI Imagen API error: ${response.status}`);
    }

    const data = await response.json() as VertexAIImageResponse;
    
    if (!data.predictions || data.predictions.length === 0) {
      throw new Error('No image generated from Vertex AI');
    }

    // Convert base64 to data URL
    const base64Image = data.predictions[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${base64Image}`;

    console.log('✅ Image generated successfully');

    return {
      imageUrl,
      prompt,
      model: 'imagen-3.0-generate-001'
    };
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

/**
 * Generate a video using Vertex AI Veo 2 (if available)
 * Note: Veo 2 might not be publicly available yet
 */
export async function generateVideo(
  prompt: string,
  apiKey: string,
  projectId: string
): Promise<VideoGenerationResult> {
  // Veo 2 endpoint (experimental)
  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/veo-2.0-generate-001:predict`;

  console.log('🎬 Generating video with Vertex AI Veo 2...');
  console.log('Prompt:', prompt.substring(0, 100));

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          }
        ],
        parameters: {
          sampleCount: 1,
          duration: 5, // 5 seconds for shorts
          aspectRatio: '9:16', // Vertical video
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI Veo error status:', response.status);
      console.error('Vertex AI Veo error body:', errorText);
      
      // If Veo is not available, return a mock response
      if (response.status === 404) {
        console.warn('⚠️ Veo 2 not available. Returning mock video.');
        return {
          videoUrl: 'https://placeholder.com/video-coming-soon.mp4',
          prompt,
          model: 'veo-2.0-generate-001 (mock)'
        };
      }
      
      throw new Error(`Vertex AI Veo API error: ${response.status}`);
    }

    const data = await response.json() as VertexAIVideoResponse;
    
    if (!data.predictions || data.predictions.length === 0) {
      throw new Error('No video generated from Vertex AI');
    }

    const prediction = data.predictions[0];
    let videoUrl: string;

    if (prediction.videoUri) {
      videoUrl = prediction.videoUri;
    } else if (prediction.bytesBase64Encoded) {
      videoUrl = `data:video/mp4;base64,${prediction.bytesBase64Encoded}`;
    } else {
      throw new Error('No video data in response');
    }

    console.log('✅ Video generated successfully');

    return {
      videoUrl,
      prompt,
      model: 'veo-2.0-generate-001'
    };
  } catch (error) {
    console.error('Video generation error:', error);
    throw error;
  }
}
