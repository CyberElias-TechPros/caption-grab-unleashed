
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
    // First, get available caption tracks
    const captionTracks = await fetchCaptionTracks(videoId, apiKey);
    
    if (captionTracks.length === 0) {
      throw new Error("No captions available for this video");
    }
    
    // Find the best matching caption track
    let selectedTrack = captionTracks.find(track => track.languageCode === language);
    
    // If exact language not found, try to find English or the first available
    if (!selectedTrack) {
      selectedTrack = captionTracks.find(track => track.languageCode === "en") || captionTracks[0];
    }
    
    // Try to fetch the actual transcript using YouTube's transcript endpoint
    try {
      const transcript = await fetchYouTubeTranscript(videoId, selectedTrack.languageCode);
      return transcript;
    } catch (transcriptError) {
      console.warn("Failed to fetch transcript, falling back to API method:", transcriptError);
      
      // Fallback: Try to get transcript via the official API
      // Note: This requires OAuth, so we'll try a workaround
      try {
        const officialTranscript = await fetchOfficialCaptions(selectedTrack.id, apiKey);
        return officialTranscript;
      } catch (apiError) {
        console.warn("Official API method failed:", apiError);
        throw new Error("Unable to fetch captions. This video may not have publicly available captions or may require special permissions.");
      }
    }
  } catch (error) {
    console.error("Error fetching captions:", error);
    throw error;
  }
}

/**
 * Fetch YouTube transcript using the transcript endpoint
 * @param videoId - The YouTube video ID
 * @param languageCode - Language code for the transcript
 * @returns Promise with full transcript text
 */
async function fetchYouTubeTranscript(videoId: string, languageCode: string): Promise<string> {
  // Try multiple transcript URL patterns
  const transcriptUrls = [
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&v=${videoId}&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&v=${videoId}&fmt=vtt`,
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&v=${videoId}`,
    // Auto-generated captions
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&v=${videoId}&kind=asr&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?lang=${languageCode}&v=${videoId}&kind=asr&fmt=vtt`,
  ];
  
  for (const url of transcriptUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.text();
        
        if (data && data.length > 100) { // Ensure we got actual content
          return parseTranscriptData(data, url.includes('fmt=vtt'));
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
      continue;
    }
  }
  
  throw new Error("Could not fetch transcript from any available source");
}

/**
 * Parse transcript data from different formats
 * @param data - Raw transcript data
 * @param isVTT - Whether the data is in VTT format
 * @returns Formatted transcript text
 */
function parseTranscriptData(data: string, isVTT: boolean = false): string {
  try {
    if (isVTT) {
      // Parse VTT format
      const lines = data.split('\n');
      let transcript = '';
      let isTextLine = false;
      
      for (const line of lines) {
        if (line.includes('-->')) {
          isTextLine = true;
          continue;
        }
        
        if (isTextLine && line.trim() && !line.startsWith('WEBVTT') && !line.includes('-->')) {
          // Clean up HTML tags and decode entities
          const cleanLine = line
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          
          if (cleanLine) {
            transcript += cleanLine + ' ';
          }
          isTextLine = false;
        }
      }
      
      return transcript.trim();
    } else {
      // Parse SRV3/XML format
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');
      const textElements = xmlDoc.getElementsByTagName('text');
      
      let transcript = '';
      
      for (let i = 0; i < textElements.length; i++) {
        const element = textElements[i];
        const text = element.textContent || '';
        
        if (text.trim()) {
          // Clean up and decode the text
          const cleanText = text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          
          transcript += cleanText + ' ';
        }
      }
      
      return transcript.trim();
    }
  } catch (error) {
    console.error('Error parsing transcript data:', error);
    throw new Error('Failed to parse transcript data');
  }
}

/**
 * Fallback method to fetch captions using official API
 * @param captionId - The caption track ID
 * @param apiKey - YouTube API key
 * @returns Promise with caption text
 */
async function fetchOfficialCaptions(captionId: string, apiKey: string): Promise<string> {
  // This requires OAuth 2.0, so it will likely fail with just an API key
  // But we'll try anyway as a fallback
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${apiKey}`,
    {
      headers: {
        'Accept': 'text/vtt'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch official captions: ${response.status} ${response.statusText}`);
  }
  
  const vttData = await response.text();
  return parseTranscriptData(vttData, true);
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
