import React, { useState } from "react";
import { Settings, RotateCcw, Languages, LayoutList, Download, History, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettings, type TranscriptView, type ExportFormat } from "@/contexts/SettingsContext";
import { QUICK_LANGUAGES } from "@/config/apiConfig";
import { toast } from "sonner";

const VIEW_OPTIONS: Array<{ value: TranscriptView; label: string }> = [
  { value: "segments", label: "Timestamped segments" },
  { value: "paragraphs", label: "Reading paragraphs" },
];

const FORMAT_OPTIONS: Array<{ value: ExportFormat; label: string }> = [
  { value: "txt", label: "Plain text (.txt)" },
  { value: "timestamped", label: "Timestamped text (.txt)" },
  { value: "srt", label: "SubRip subtitles (.srt)" },
  { value: "vtt", label: "WebVTT subtitles (.vtt)" },
  { value: "json", label: "Structured data (.json)" },
];

const SettingsDialog: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" aria-label="Open settings">
          <Settings className="h-[18px] w-[18px]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-display">Preferences</DialogTitle>
          <DialogDescription>
            Stored only in your browser. No account, no tracking, no API keys needed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="setting-language" className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-4 w-4 text-primary" /> Default language
            </Label>
            <Select
              value={settings.defaultLanguage}
              onValueChange={(v) => updateSettings({ defaultLanguage: v })}
            >
              <SelectTrigger id="setting-language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {QUICK_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used when a video offers multiple caption tracks.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setting-view" className="flex items-center gap-2 text-sm font-medium">
              <LayoutList className="h-4 w-4 text-primary" /> Transcript layout
            </Label>
            <Select
              value={settings.transcriptView}
              onValueChange={(v) => updateSettings({ transcriptView: v as TranscriptView })}
            >
              <SelectTrigger id="setting-view">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                {VIEW_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setting-format" className="flex items-center gap-2 text-sm font-medium">
              <Download className="h-4 w-4 text-primary" /> One-click download format
            </Label>
            <Select
              value={settings.exportFormat}
              onValueChange={(v) => updateSettings({ exportFormat: v as ExportFormat })}
            >
              <SelectTrigger id="setting-format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <History className="h-4 w-4 text-primary" /> Keep local history
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Reopen past extractions offline. Stored on this device only.
              </p>
            </div>
            <Switch
              checked={settings.historyEnabled}
              onCheckedChange={(v) => updateSettings({ historyEnabled: v })}
              aria-label="Toggle local history"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <Wand2 className="h-4 w-4 text-primary" /> Smart auto-translate
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Fall back to machine translation when your language track is missing.
              </p>
            </div>
            <Switch
              checked={settings.autoTranslate}
              onCheckedChange={(v) => updateSettings({ autoTranslate: v })}
              aria-label="Toggle auto-translate fallback"
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              resetSettings();
              toast.success("Preferences reset to defaults");
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
