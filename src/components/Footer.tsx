
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t py-6 mt-8">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CaptionGrab. Powered by lovable.dev & Supabase.
          </div>
          <div className="text-sm text-gray-500 flex gap-6">
            <a href="#" className="hover:text-caption-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-caption-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-caption-primary transition-colors">About</a>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-400 text-center">
          CaptionGrab extracts captions from videos for free. YouTube API quota: ~40-50 downloads/day.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
