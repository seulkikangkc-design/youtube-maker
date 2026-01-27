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
 * Uses OAuth 2.0 Bearer Token authentication (not API key)
 */
export async function generateImage(
  prompt: string,
  accessToken: string,
  projectId: string
): Promise<ImageGenerationResult> {
  const location = 'us-central1';
  const modelId = 'imagegeneration@006'; // Imagen 3
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

  console.log('🎨 Generating image with Vertex AI Imagen 3...');
  console.log('Prompt:', prompt.substring(0, 100));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}` // ✅ Bearer Token authentication
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
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
      model: modelId
    };
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

/**
 * Generate a video using Vertex AI Veo 2
 * Uses OAuth 2.0 Bearer Token authentication (not API key)
 */
export async function generateVideo(
  prompt: string,
  accessToken: string,
  projectId: string
): Promise<VideoGenerationResult> {
  const location = 'us-central1';
  
  // Try multiple Veo model versions
  const models = [
    'veo-001',
    'veo-2.0-generate-001',
    'video-generation@001'
  ];

  console.log('🎬 Generating video with Vertex AI Veo...');
  console.log('Prompt:', prompt.substring(0, 100));

  // Try each model until one works
  for (const modelId of models) {
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

    try {
      console.log(`Trying model: ${modelId}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` // ✅ Bearer Token authentication
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: prompt,
            }
          ],
          parameters: {
            sampleCount: 1,
            durationSeconds: 5,
            aspectRatio: '9:16',
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Model ${modelId} error:`, response.status, errorText);
        
        // Try next model
        if (response.status === 404) {
          continue;
        }
        
        throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
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

      console.log('✅ Video generated successfully with model:', modelId);

      return {
        videoUrl,
        prompt,
        model: modelId
      };
      
    } catch (error) {
      console.error(`Error with model ${modelId}:`, error);
      // Continue to next model
    }
  }

  // All models failed - return mock
  console.warn('⚠️ All Veo models failed. Returning mock video.');
  console.warn('⚠️ Please ensure your Google Cloud project has access to Veo.');
  
  return {
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt,
    model: 'veo (mock - access required)'
  };
}
