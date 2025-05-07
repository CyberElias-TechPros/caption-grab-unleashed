
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoForm from '@/components/VideoForm';
import CaptionDisplay from '@/components/CaptionDisplay';
import QuotaDisplay from '@/components/QuotaDisplay';
import { fetchCaptions, fetchCaptionTracks, CaptionTrack } from '@/utils/videoUtils';

const Index: React.FC = () => {
  const [captions, setCaptions] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const quotaTotal = 50; // Approximate daily limit based on YouTube API quota
  
  const handleFetchCaptions = async (videoId: string, language: string) => {
    setIsLoading(true);
    try {
      const captionText = await fetchCaptions(videoId, language);
      setCaptions(captionText);
      setCurrentVideoUrl(videoId);
      setCurrentLanguage(language);
      
      // Update quota count (in a real app, this would be stored in a database)
      setQuotaUsed(prev => Math.min(prev + 1, quotaTotal));
    } catch (error) {
      console.error('Error fetching captions:', error);
      setCaptions('Error fetching captions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFetchTracks = async (videoId: string): Promise<CaptionTrack[]> => {
    try {
      return await fetchCaptionTracks(videoId);
    } catch (error) {
      console.error('Error fetching caption tracks:', error);
      return [];
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Caption<span className="gradient-text">Grab</span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Extract video subtitles instantly—for free.
            </p>
            <div className="bg-white border border-gray-200 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                CaptionGrab extracts captions from YouTube videos using the official YouTube Data API.
                Due to API limitations, we currently support YouTube videos only in the free tier.
                For other platforms, we provide guidance on how to access captions manually.
              </p>
            </div>
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
