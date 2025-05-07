
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
 * Mock function to simulate fetching captions
 * This would be replaced with an actual API call to Supabase Edge Function
 * @param videoId - The video ID
 * @param language - The language code to fetch
 * @returns Promise with caption text
 */
export async function fetchCaptions(
  videoId: string,
  language: string = "en"
): Promise<string> {
  // In a real implementation, this would call the Supabase Edge Function
  // return await supabaseClient.functions.invoke("get-captions", {
  //   body: { videoId, language }
  // });
  
  // For now, we'll return a mock response for demonstration
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        `[00:00:00] This is a sample caption text\n` +
        `[00:00:05] It would normally contain timestamps and text\n` +
        `[00:00:10] Extracted from the video's closed captions\n` +
        `[00:00:15] This is just a placeholder\n` +
        `[00:00:20] That would be replaced with real API calls\n` +
        `[00:00:25] The actual implementation would extract real captions\n` +
        `[00:00:30] Using the YouTube Data API\n`
      );
    }, 1500); // Simulate API delay
  });
}

/**
 * Mock function to simulate fetching available caption tracks
 * This would be replaced with an actual API call to Supabase Edge Function
 * @param videoId - The video ID
 * @returns Promise with available caption tracks
 */
export async function fetchCaptionTracks(
  videoId: string
): Promise<CaptionTrack[]> {
  // In a real implementation, this would call the Supabase Edge Function
  // return await supabaseClient.functions.invoke("get-caption-tracks", {
  //   body: { videoId }
  // });
  
  // For now, we'll return mock tracks for demonstration
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "a.en", name: "English", languageCode: "en" },
        { id: "a.es", name: "Spanish", languageCode: "es" },
        { id: "a.fr", name: "French", languageCode: "fr" },
        { id: "a.de", name: "German", languageCode: "de" },
      ]);
    }, 1000); // Simulate API delay
  });
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
