
// Default API keys (provided publicly)
export const DEFAULT_YOUTUBE_API_KEYS = [
  'AIzaSyAZkphOCreMlQIN7eHkq0n0U1RGL9iYCdg',
  'AIzaSyDGYdEa7LVtwum8ufO8qhvXN1fBy3PfRa0'
];

// Local storage keys
export const LOCAL_STORAGE_KEYS = {
  YOUTUBE_API_KEY: 'captionGrab_youtubeApiKey',
  API_KEY_SETTINGS: 'captionGrab_apiKeySettings'
};

// API endpoints
export const API_ENDPOINTS = {
  YOUTUBE_CAPTION_TRACKS: 'https://www.googleapis.com/youtube/v3/captions',
  YOUTUBE_VIDEO: 'https://www.googleapis.com/youtube/v3/videos'
};

// Quota costs per operation
export const QUOTA_COSTS = {
  LIST_CAPTIONS: 50,  // captions.list
  DOWNLOAD_CAPTION: 200 // captions.download
};
