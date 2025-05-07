
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface QuotaDisplayProps {
  used: number;
  total: number;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ used, total }) => {
  const percentUsed = (used / total) * 100;
  const remaining = total - used;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
      <h3 className="text-sm font-medium mb-2">YouTube API Daily Quota</h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {used} used of {total} (~{remaining} remaining today)
        </span>
        <span className="text-xs text-gray-500">
          Resets at midnight UTC
        </span>
      </div>
      <Progress value={percentUsed} className="h-2" />
    </div>
  );
};

export default QuotaDisplay;
