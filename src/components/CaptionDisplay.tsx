
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { downloadTextFile } from '@/utils/videoUtils';
import { useToast } from '@/components/ui/use-toast';

interface CaptionDisplayProps {
  captions: string;
  videoUrl: string;
  language: string;
}

const CaptionDisplay: React.FC<CaptionDisplayProps> = ({ captions, videoUrl, language }) => {
  const { toast } = useToast();
  
  const handleDownload = () => {
    try {
      // Extract video ID or use a timestamp for the filename
      let filename = 'captions.txt';
      
      if (videoUrl) {
        const matches = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:\?|&|$)/);
        if (matches && matches[1]) {
          filename = `captions_${matches[1]}_${language}.txt`;
        }
      }
      
      downloadTextFile(captions, filename);
      
      toast({
        title: "Downloaded Successfully",
        description: "Caption file has been downloaded to your device.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the caption file.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(captions);
      toast({
        title: "Copied to Clipboard",
        description: "Caption text has been copied to your clipboard.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy Failed",
        description: "There was an error copying the text to clipboard.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">Extracted Captions</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-1 h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      <div className="caption-container">
        {captions}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Note: These captions are extracted using the YouTube Data API and are subject to its terms of service.
      </div>
    </div>
  );
};

export default CaptionDisplay;
