// GenSpark Video and Image Generation - Using Mock/Placeholder
// Note: Real GenSpark API integration requires backend infrastructure
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
 * Generate a video - Returns placeholder for now
 * TODO: Integrate with actual video generation service
 */
export async function generateVideoWithGenSpark(
  prompt: string
): Promise<GenSparkVideoResult> {
  console.log('🎬 Generating video placeholder...');
  console.log('Prompt:', prompt.substring(0, 100));

  // For now, return a sample video URL
  // In production, this would call a real video generation API
  const sampleVideos = [
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  ];
  
  const videoUrl = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('✅ Video placeholder returned');
  
  return {
    videoUrl,
    prompt,
    model: 'kling/v2.6/pro (placeholder)',
    duration: 5
  };
}

/**
 * Generate an image - Returns placeholder for now
 * TODO: Integrate with actual image generation service
 */
export async function generateImageWithGenSpark(
  prompt: string
): Promise<GenSparkImageResult> {
  console.log('🎨 Generating image placeholder...');
  console.log('Prompt:', prompt.substring(0, 100));

  // For now, return a placeholder image
  // In production, this would call a real image generation API
  const width = 1920;
  const height = 1080;
  const imageUrl = `https://placehold.co/${width}x${height}/4F46E5/white?text=${encodeURIComponent(prompt.substring(0, 50))}`;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('✅ Image placeholder returned');
  
  return {
    imageUrl,
    prompt,
    model: 'fal-ai/flux-2-pro (placeholder)'
  };
}
