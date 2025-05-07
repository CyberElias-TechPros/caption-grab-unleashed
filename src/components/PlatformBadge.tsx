
import React from 'react';
import { Platform } from '@/utils/videoUtils';

interface PlatformBadgeProps {
  platform: Platform;
}

const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform }) => {
  const badgeClasses = {
    youtube: "platform-badge-youtube",
    facebook: "platform-badge-facebook",
    twitter: "platform-badge-twitter",
    linkedin: "platform-badge-linkedin",
    unsupported: "platform-badge-unsupported"
  };
  
  const platformLabels = {
    youtube: "YouTube",
    facebook: "Facebook",
    twitter: "Twitter/X",
    linkedin: "LinkedIn",
    unsupported: "Unsupported"
  };
  
  return (
    <span className={`platform-badge ${badgeClasses[platform]}`}>
      {platformLabels[platform]}
    </span>
  );
};

export default PlatformBadge;
