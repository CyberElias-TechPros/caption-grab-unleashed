
import React from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="border-b bg-white py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-caption-primary to-caption-secondary flex items-center justify-center text-white font-bold">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold">
              Caption<span className="gradient-text">Grab</span>
            </h1>
            <p className="text-xs text-gray-500">Free Video Caption Extractor</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
