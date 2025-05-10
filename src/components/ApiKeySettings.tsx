
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Settings, Key, Info } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useToast } from '@/hooks/use-toast';

const ApiKeySettings: React.FC = () => {
  const { youtubeApiKey, apiKeySettings, setCustomYoutubeApiKey, updateApiKeySettings, resetToDefaultKeys, isUsingDefaultKey } = useApiKey();
  const [newApiKey, setNewApiKey] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveKey = () => {
    if (newApiKey && newApiKey.trim() !== '') {
      setCustomYoutubeApiKey(newApiKey.trim());
      updateApiKeySettings({ useCustomKeys: true });
      toast({
        title: "API Key Updated",
        description: "Your YouTube API key has been saved and will be used for future requests.",
        duration: 3000,
      });
      setNewApiKey('');
      setIsOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleToggleCustomKeys = (value: boolean) => {
    updateApiKeySettings({ useCustomKeys: value });
    toast({
      title: value ? "Using Custom API Key" : "Using Default API Keys",
      description: value 
        ? "Your custom API key will be used for all requests" 
        : "Default API keys will be used for all requests",
      duration: 3000,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-1">
          <Settings size={16} />
          <span className="hidden md:inline">API Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>YouTube API Settings</DialogTitle>
          <DialogDescription>
            Configure your YouTube API key for caption extraction.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Use Custom API Key</span>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Info size={14} className="cursor-help text-gray-400" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="text-sm">
                      <p className="font-medium">About YouTube API Keys</p>
                      <p className="mt-1">
                        Using your own API key allows you to have your own quota 
                        limit (10,000 units/day). Without a custom key, you'll share
                        the quota with all CaptionGrab users.
                      </p>
                      <a 
                        href="https://developers.google.com/youtube/v3/getting-started" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-2 block"
                      >
                        Learn how to get your own YouTube API key
                      </a>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Switch 
                checked={apiKeySettings.useCustomKeys} 
                onCheckedChange={handleToggleCustomKeys}
                disabled={!apiKeySettings.useCustomKeys && !newApiKey}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium flex items-center gap-1">
              <Key size={14} />
              YouTube API Key
            </label>
            <div className="flex items-center gap-2">
              <Input 
                id="api-key" 
                value={newApiKey} 
                onChange={(e) => setNewApiKey(e.target.value)}
                type="password" 
                placeholder="Enter your YouTube API key"
                className="flex-1"
              />
            </div>
            {isUsingDefaultKey && (
              <p className="text-xs text-amber-600 mt-1">
                Currently using a shared API key (~40-50 downloads/day across all users)
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button
            variant="outline" 
            onClick={resetToDefaultKeys}
            type="button"
          >
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSaveKey}>Save API Key</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySettings;
