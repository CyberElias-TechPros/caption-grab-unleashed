
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info } from 'lucide-react';

interface QuotaDisplayProps {
  used: number;
  total: number;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ used, total }) => {
  const { isUsingDefaultKey } = useApiKey();
  const percentUsed = (used / total) * 100;
  const remaining = total - used;
  
  // Determine the appropriate color based on percentage used
  const getProgressColor = () => {
    if (percentUsed > 90) return "bg-red-500";
    if (percentUsed > 70) return "bg-amber-500";
    return "bg-emerald-500";
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium">
          YouTube API Daily Quota
          <HoverCard>
            <HoverCardTrigger className="inline-flex ml-1">
              <Info size={14} className="text-gray-400" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="text-sm">
                <p className="font-medium">About YouTube API Quota</p>
                <p className="mt-1">
                  The YouTube Data API has a daily quota limit. Each caption extraction
                  uses approximately 250 units of quota. With a typical daily limit of 10,000 units,
                  you can extract captions from about 40 videos per day.
                </p>
                {isUsingDefaultKey && (
                  <p className="mt-2 text-amber-600">
                    You're currently using the shared API key, which means the quota
                    is shared among all CaptionGrab users. Consider adding your own API key
                    in the settings.
                  </p>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        </h3>
        <span className="text-xs text-gray-500">
          Resets at midnight PST
        </span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-600">
          {used} used of {total} {isUsingDefaultKey ? "(shared)" : "(your key)"} 
        </span>
        <span className="text-xs text-gray-600">
          ~{remaining} operations remaining today
        </span>
      </div>
      <div className="relative w-full">
        <Progress 
          value={percentUsed} 
          className={`h-2 ${getProgressColor()}`}
        />
      </div>
    </div>
  );
};

export default QuotaDisplay;
