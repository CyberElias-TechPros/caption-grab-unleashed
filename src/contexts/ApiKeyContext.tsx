
import React, { createContext, useState, useEffect, useContext } from 'react';
import { DEFAULT_YOUTUBE_API_KEYS, LOCAL_STORAGE_KEYS } from '@/config/apiConfig';

interface ApiKeySettings {
  useCustomKeys: boolean;
  shareCustomKeys: boolean;
}

interface ApiKeyContextType {
  youtubeApiKey: string;
  apiKeySettings: ApiKeySettings;
  setCustomYoutubeApiKey: (key: string) => void;
  updateApiKeySettings: (settings: Partial<ApiKeySettings>) => void;
  resetToDefaultKeys: () => void;
  isUsingDefaultKey: boolean;
}

const defaultSettings: ApiKeySettings = {
  useCustomKeys: false,
  shareCustomKeys: false
};

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKeySettings, setApiKeySettings] = useState<ApiKeySettings>(defaultSettings);
  const [customYoutubeApiKey, setCustomYoutubeApiKey] = useState<string>('');
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY_SETTINGS);
    const storedYoutubeKey = localStorage.getItem(LOCAL_STORAGE_KEYS.YOUTUBE_API_KEY);
    
    if (storedSettings) {
      try {
        setApiKeySettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error('Error parsing API key settings:', e);
      }
    }
    
    if (storedYoutubeKey) {
      setCustomYoutubeApiKey(storedYoutubeKey);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.API_KEY_SETTINGS, JSON.stringify(apiKeySettings));
  }, [apiKeySettings]);

  // Save custom key to localStorage when it changes
  useEffect(() => {
    if (customYoutubeApiKey) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.YOUTUBE_API_KEY, customYoutubeApiKey);
    }
  }, [customYoutubeApiKey]);

  // Rotate through default keys to distribute quota usage
  const getDefaultKey = () => {
    const key = DEFAULT_YOUTUBE_API_KEYS[currentKeyIndex];
    setCurrentKeyIndex((prevIndex) => 
      (prevIndex + 1) % DEFAULT_YOUTUBE_API_KEYS.length
    );
    return key;
  };

  const youtubeApiKey = apiKeySettings.useCustomKeys && customYoutubeApiKey 
    ? customYoutubeApiKey 
    : getDefaultKey();
  
  const isUsingDefaultKey = !apiKeySettings.useCustomKeys || !customYoutubeApiKey;

  const updateApiKeySettings = (newSettings: Partial<ApiKeySettings>) => {
    setApiKeySettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDefaultKeys = () => {
    setApiKeySettings(defaultSettings);
    setCustomYoutubeApiKey('');
    localStorage.removeItem(LOCAL_STORAGE_KEYS.YOUTUBE_API_KEY);
  };

  return (
    <ApiKeyContext.Provider 
      value={{ 
        youtubeApiKey, 
        apiKeySettings, 
        setCustomYoutubeApiKey, 
        updateApiKeySettings,
        resetToDefaultKeys,
        isUsingDefaultKey
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
