
import React from 'react';
import { Platform } from '@/utils/videoUtils';

interface PlatformBadgeProps {
  platform: Platform;
}

const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform }) => {
  const badgeColors = {
    youtube: "bg-red-100 text-red-800 border-red-200",
    facebook: "bg-blue-100 text-blue-800 border-blue-200",
    twitter: "bg-sky-100 text-sky-800 border-sky-200",
    linkedin: "bg-blue-100 text-blue-800 border-blue-200",
    unsupported: "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  const platformLabels = {
    youtube: "YouTube",
    facebook: "Facebook",
    twitter: "Twitter/X",
    linkedin: "LinkedIn",
    unsupported: "Unsupported"
  };
  
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border ${badgeColors[platform]}`}>
      {platformLabels[platform]}
    </span>
  );
};

export default PlatformBadge;
