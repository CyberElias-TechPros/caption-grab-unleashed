
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoForm from '@/components/VideoForm';
import CaptionDisplay from '@/components/CaptionDisplay';
import QuotaDisplay from '@/components/QuotaDisplay';
import ApiKeySettings from '@/components/ApiKeySettings';
import { 
  fetchCaptions, 
  fetchCaptionTracks, 
  CaptionTrack, 
  handleYoutubeApiError 
} from '@/utils/videoUtils';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useToast } from '@/hooks/use-toast';
import { LOCAL_STORAGE_KEYS } from '@/config/apiConfig';

const Index: React.FC = () => {
  const [captions, setCaptions] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const { youtubeApiKey, isUsingDefaultKey } = useApiKey();
  const { toast } = useToast();
  
  const quotaTotal = 50; // Approximate daily limit for shared keys
  
  // Load quota used from localStorage on initial render
  useEffect(() => {
    const storedQuota = localStorage.getItem('captionGrab_quotaUsed');
    const storedQuotaDate = localStorage.getItem('captionGrab_quotaDate');
    
    // Reset quota if it's a new day
    const today = new Date().toDateString();
    if (storedQuotaDate !== today) {
      setQuotaUsed(0);
      localStorage.setItem('captionGrab_quotaDate', today);
      localStorage.setItem('captionGrab_quotaUsed', '0');
    } else if (storedQuota) {
      setQuotaUsed(parseInt(storedQuota, 10));
    }
  }, []);
  
  // Save quota used to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('captionGrab_quotaUsed', quotaUsed.toString());
  }, [quotaUsed]);
  
  const handleFetchCaptions = async (videoId: string, language: string) => {
    setIsLoading(true);
    try {
      const captionText = await fetchCaptions(videoId, language, youtubeApiKey);
      setCaptions(captionText);
      setCurrentVideoUrl(videoId);
      setCurrentLanguage(language);
      
      // Update quota count
      const newQuotaUsed = quotaUsed + 1;
      setQuotaUsed(newQuotaUsed);
      
      // Show success toast
      toast({
        title: "Captions Extracted",
        description: "Captions have been successfully extracted from the video.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error fetching captions:', error);
      const errorMessage = handleYoutubeApiError(error);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      setCaptions(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFetchTracks = async (videoId: string): Promise<CaptionTrack[]> => {
    try {
      return await fetchCaptionTracks(videoId, youtubeApiKey);
    } catch (error) {
      console.error('Error fetching caption tracks:', error);
      const errorMessage = handleYoutubeApiError(error);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      return [];
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold">
                Caption<span className="text-caption-primary">Grab</span>
              </h1>
              <p className="text-xl text-gray-600">
                Extract video subtitles instantly—for free.
              </p>
            </div>
            <ApiKeySettings />
          </div>
          
          <div className="bg-white border border-gray-200 p-4 rounded-md mb-6">
            <p className="text-sm text-gray-600">
              CaptionGrab extracts captions from YouTube videos using the official YouTube Data API.
              Due to API limitations, we currently support YouTube videos only in the free tier.
              For other platforms, we provide guidance on how to access captions manually.
            </p>
          </div>
          
          <VideoForm 
            onFetchCaptions={handleFetchCaptions}
            onFetchTracks={handleFetchTracks}
            isLoading={isLoading}
          />
          
          <QuotaDisplay used={quotaUsed} total={quotaTotal} />
          
          {captions && (
            <CaptionDisplay 
              captions={captions}
              videoUrl={currentVideoUrl}
              language={currentLanguage}
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
