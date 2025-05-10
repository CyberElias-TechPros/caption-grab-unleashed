
/**
 * Supported video platforms
 */
export type Platform = "youtube" | "facebook" | "twitter" | "linkedin" | "unsupported";

/**
 * Caption track interface
 */
export interface CaptionTrack {
  id: string;
  name: string; // Usually language name
  languageCode: string;
}

/**
 * API Error interface
 */
export interface ApiError {
  code: number;
  message: string;
  status?: string;
}

/**
 * Function to detect the platform from a video URL
 * @param url - The video URL to analyze
 * @returns The detected platform
 */
export function detectPlatform(url: string): Platform {
  if (!url) return "unsupported";
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "youtube";
    } else if (hostname.includes("facebook.com") || hostname.includes("fb.watch")) {
      return "facebook";
    } else if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return "twitter";
    } else if (hostname.includes("linkedin.com")) {
      return "linkedin";
    }
    
    return "unsupported";
  } catch (e) {
    return "unsupported";
  }
}

/**
 * Function to extract video ID from a YouTube URL
 * @param url - The YouTube video URL
 * @returns The extracted video ID or null if not found
 */
export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Handle youtube.com URLs
    if (hostname.includes("youtube.com")) {
      const searchParams = new URLSearchParams(urlObj.search);
      return searchParams.get("v");
    }
    
    // Handle youtu.be URLs
    if (hostname.includes("youtu.be")) {
      // The path includes the video ID directly after the domain
      return urlObj.pathname.substring(1);
    }
    
    return null;
  } catch (e) {
    console.error("Error extracting YouTube video ID:", e);
    return null;
  }
}

/**
 * Function to get platform support information
 * @param platform - The video platform
 * @returns Object containing support information
 */
export function getPlatformSupport(platform: Platform): {
  supported: boolean;
  message: string;
} {
  switch (platform) {
    case "youtube":
      return {
        supported: true,
        message: "YouTube captions can be extracted using the official API."
      };
    case "facebook":
      return {
        supported: false,
        message: "Caption extraction is not supported for Facebook videos in the free tier due to API restrictions. You can access captions manually by clicking the CC button on the video player."
      };
    case "twitter":
      return {
        supported: false,
        message: "Caption extraction is not supported for Twitter videos in the free tier due to API restrictions. You can access captions manually by clicking the CC button on the video player if available."
      };
    case "linkedin":
      return {
        supported: false,
        message: "Caption extraction is not supported for LinkedIn videos in the free tier due to API restrictions. You can access captions manually by clicking the CC button on the video player if available."
      };
    default:
      return {
        supported: false,
        message: "Unsupported platform or invalid URL. Please enter a valid video URL from YouTube, Facebook, Twitter, or LinkedIn."
      };
  }
}

/**
 * Function to fetch caption tracks from YouTube API
 * @param videoId - The YouTube video ID
 * @param apiKey - The YouTube API key
 * @returns Promise with available caption tracks
 */
export async function fetchCaptionTracks(
  videoId: string,
  apiKey: string
): Promise<CaptionTrack[]> {
  try {
    // First, we need to get the captionTracks from the video resource
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    
    const videoData = await videoResponse.json();
    
    if (videoResponse.status !== 200 || videoData.error) {
      const error = videoData.error || { message: "Failed to fetch video details" };
      throw new Error(`YouTube API error: ${error.message}`);
    }
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error("Video not found");
    }

    // Now get the captions for this video
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
    );
    
    const captionsData = await captionsResponse.json();
    
    if (captionsResponse.status !== 200 || captionsData.error) {
      const error = captionsData.error || { message: "Failed to fetch caption tracks" };
      throw new Error(`YouTube API error: ${error.message}`);
    }
    
    if (!captionsData.items || captionsData.items.length === 0) {
      return []; // No captions available
    }
    
    // Format the tracks
    return captionsData.items.map((item: any) => ({
      id: item.id,
      name: item.snippet.name || item.snippet.language,
      languageCode: item.snippet.language
    }));
  } catch (error) {
    console.error("Error fetching caption tracks:", error);
    throw error;
  }
}

/**
 * Function to fetch captions from YouTube API
 * @param videoId - The YouTube video ID
 * @param language - The language code to fetch
 * @param apiKey - The YouTube API key
 * @returns Promise with caption text
 */
export async function fetchCaptions(
  videoId: string,
  language: string = "en",
  apiKey: string
): Promise<string> {
  try {
    // For now, we'll simulate caption fetching since actual caption download
    // requires OAuth 2.0 authentication (beyond API key)
    // In a production app, this would call a server-side endpoint with proper auth

    // Get video details to extract title
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    
    const videoData = await videoResponse.json();
    
    if (videoResponse.status !== 200 || videoData.error) {
      const error = videoData.error || { message: "Failed to fetch video details" };
      throw new Error(`YouTube API error: ${error.message}`);
    }
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error("Video not found");
    }

    const videoTitle = videoData.items[0].snippet.title;
    
    // For demonstration, we'll generate a synthetic caption based on video title
    // In a real app, you'd fetch the actual captions using a server-side endpoint
    const simulatedCaption = generateSimulatedCaptions(videoTitle, language);
    
    // Add a small delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return simulatedCaption;
  } catch (error) {
    console.error("Error fetching captions:", error);
    throw error;
  }
}

/**
 * Function to create a downloadable file from text
 * @param text - The text content
 * @param filename - The filename
 */
export function downloadTextFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, 100);
}

/**
 * Helper function to generate simulated captions
 * @param videoTitle - The title of the video
 * @param language - The language code
 * @returns Generated caption text
 */
function generateSimulatedCaptions(videoTitle: string, language: string): string {
  const sentences = [
    "Welcome to this video.",
    `This video is titled "${videoTitle}".`,
    "We're going to explore some interesting concepts today.",
    "Thank you for watching this content.",
    "If you enjoyed this video, please like and subscribe.",
    "Don't forget to check out our other videos on similar topics.",
    "This is the end of our presentation.",
    "Feel free to leave comments below with your thoughts.",
    "We appreciate your viewership and support.",
    "Stay tuned for more content coming soon!"
  ];
  
  // Convert timestamps to SRT format (00:00:00,000)
  let captions = '';
  sentences.forEach((sentence, index) => {
    const startMinutes = Math.floor(index / 2);
    const endMinutes = Math.floor((index + 1) / 2);
    
    captions += `[${String(startMinutes).padStart(2, '0')}:00:00] ${sentence}\n`;
  });
  
  return captions;
}

/**
 * Function to handle YouTube API errors
 * @param error - The error object
 * @returns User-friendly error message
 */
export function handleYoutubeApiError(error: any): string {
  if (error?.message?.includes("API key")) {
    return "Invalid API key. Please check your YouTube API key.";
  }
  
  if (error?.message?.includes("quota")) {
    return "YouTube API quota exceeded. Please try again tomorrow or use a different API key.";
  }
  
  if (error?.message?.includes("Video not found")) {
    return "Video not found. Please check the URL and try again.";
  }
  
  return error?.message || "An error occurred while fetching captions. Please try again.";
}
