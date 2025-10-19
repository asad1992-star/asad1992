
import React from 'react';
import type { Platform } from '../types';
import { WindowsIcon } from './icons/WindowsIcon';
import { AppleIcon } from './icons/AppleIcon';
import { LinuxIcon } from './icons/LinuxIcon';

interface PlatformSelectorProps {
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

const platforms: { id: Platform; name: string; icon: React.ReactNode }[] = [
  { id: 'windows', name: 'Windows', icon: <WindowsIcon className="h-6 w-6" /> },
  { id: 'macos', name: 'macOS', icon: <AppleIcon className="h-6 w-6" /> },
  { id: 'linux', name: 'Linux', icon: <LinuxIcon className="h-6 w-6" /> },
];

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatform, onPlatformChange }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {platforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => onPlatformChange(platform.id)}
          className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors duration-200 ${
            selectedPlatform === platform.id
              ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg'
              : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
          }`}
        >
          {platform.icon}
          <span className="mt-2 text-sm font-medium">{platform.name}</span>
        </button>
      ))}
    </div>
  );
};
