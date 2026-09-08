import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { LOCAL_STORAGE_KEYS } from "@/config/apiConfig";

export type TranscriptView = "segments" | "paragraphs";
export type ExportFormat = "txt" | "srt" | "vtt" | "json" | "timestamped";

interface AppSettings {
  /** Default caption language requested from the API. */
  defaultLanguage: string;
  /** Preferred transcript layout. */
  transcriptView: TranscriptView;
  /** Default export format for one-click download. */
  exportFormat: ExportFormat;
  /** Whether to keep a local extraction history. */
  historyEnabled: boolean;
  /** Auto-translate when the exact language track is missing. */
  autoTranslate: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const DEFAULTS: AppSettings = {
  defaultLanguage: "en",
  transcriptView: "segments",
  exportFormat: "txt",
  historyEnabled: true,
  autoTranslate: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const { setTheme } = useTheme();

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      /* storage unavailable — settings simply won't persist */
    }
  }, [settings]);

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      resetSettings: () => {
        setSettings(DEFAULTS);
        setTheme("dark");
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
        } catch {
          /* noop */
        }
      },
    }),
    [settings, setTheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
