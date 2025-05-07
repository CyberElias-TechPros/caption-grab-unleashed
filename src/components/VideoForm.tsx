
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ArrowRight, AlertCircle } from 'lucide-react';
import PlatformBadge from '@/components/PlatformBadge';
import { Platform, detectPlatform, getPlatformSupport, extractYoutubeVideoId, CaptionTrack } from '@/utils/videoUtils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface VideoFormProps {
  onFetchCaptions: (videoId: string, language: string) => Promise<void>;
  onFetchTracks: (videoId: string) => Promise<CaptionTrack[]>;
  isLoading: boolean;
}

const VideoForm: React.FC<VideoFormProps> = ({ onFetchCaptions, onFetchTracks, isLoading }) => {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('unsupported');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState<CaptionTrack[]>([]);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  
  // Update platform when URL changes
  useEffect(() => {
    if (url) {
      const detectedPlatform = detectPlatform(url);
      setPlatform(detectedPlatform);
      
      // Reset language selector if platform changes
      if (detectedPlatform !== 'youtube') {
        setShowLanguageSelector(false);
      }
      
      // Clear error when URL changes
      if (error) {
        setError('');
      }
    } else {
      setPlatform('unsupported');
      setShowLanguageSelector(false);
    }
  }, [url]);
  
  const handleCheckUrl = async () => {
    setError('');
    
    if (!url) {
      setError('Please enter a video URL');
      return;
    }
    
    const support = getPlatformSupport(platform);
    
    if (!support.supported) {
      setError(support.message);
      return;
    }
    
    // For YouTube, fetch available caption tracks
    if (platform === 'youtube') {
      setIsCheckingUrl(true);
      
      const videoId = extractYoutubeVideoId(url);
      
      if (!videoId) {
        setError('Could not extract video ID from URL');
        setIsCheckingUrl(false);
        return;
      }
      
      try {
        const tracks = await onFetchTracks(videoId);
        
        if (tracks.length === 0) {
          setError('No caption tracks found for this video');
          setShowLanguageSelector(false);
        } else {
          setAvailableLanguages(tracks);
          setSelectedLanguage(tracks[0].languageCode);
          setShowLanguageSelector(true);
        }
      } catch (err) {
        console.error('Error fetching caption tracks:', err);
        setError('Error fetching caption tracks. Please try again.');
      } finally {
        setIsCheckingUrl(false);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (platform !== 'youtube') {
      return;
    }
    
    const videoId = extractYoutubeVideoId(url);
    
    if (!videoId) {
      setError('Could not extract video ID from URL');
      return;
    }
    
    await onFetchCaptions(videoId, selectedLanguage);
  };
  
  const platformSupport = getPlatformSupport(platform);
  
  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-4">
          <div>
            <label htmlFor="video-url" className="block text-sm font-medium mb-1">
              Video URL <span className="text-gray-500 text-xs">(YouTube, Facebook, Twitter/X, LinkedIn)</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="video-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                type="button" 
                onClick={handleCheckUrl}
                disabled={isCheckingUrl || !url}
                variant="secondary"
              >
                {isCheckingUrl ? 'Checking...' : 'Check URL'}
              </Button>
            </div>
            
            {url && platform !== 'unsupported' && (
              <div className="mt-2 flex items-center">
                <span className="text-sm mr-2">Platform:</span>
                <PlatformBadge platform={platform} />
              </div>
            )}
          </div>
          
          {!platformSupport.supported && url && platform !== 'unsupported' && (
            <Alert variant="warning" className="animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Platform Limitation</AlertTitle>
              <AlertDescription>
                {platformSupport.message}
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {showLanguageSelector && availableLanguages.length > 0 && (
            <div className="animate-fade-in">
              <label htmlFor="language-select" className="block text-sm font-medium mb-1">
                Caption Language
              </label>
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger id="language-select" className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.languageCode} value={lang.languageCode}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {showLanguageSelector && (
            <Button 
              type="submit" 
              className="caption-button w-full mt-4" 
              disabled={isLoading || !selectedLanguage}
            >
              {isLoading ? 'Fetching Captions...' : 'Get Captions'} 
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VideoForm;
