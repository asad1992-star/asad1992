
import React from 'react';
import type { Platform, AppFiles } from '../types';
import { FileInput } from './FileInput';
import { PlatformSelector } from './PlatformSelector';
import { PackageIcon } from './icons/PackageIcon';

interface InputPanelProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
  appFiles: AppFiles;
  onFileChange: (fileType: keyof AppFiles, file: File | null) => void;
  onPackage: () => void;
  isLoading: boolean;
  error: string | null;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  projectName,
  onProjectNameChange,
  platform,
  onPlatformChange,
  appFiles,
  onFileChange,
  onPackage,
  isLoading,
  error,
}) => {
  return (
    <div className="bg-slate-800/60 p-6 rounded-lg border border-slate-700 shadow-2xl space-y-6">
      <h2 className="text-xl font-semibold text-white border-b border-slate-600 pb-3">1. Configure Your Project</h2>
      
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
        <input
          type="text"
          id="projectName"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="e.g., My Awesome App"
          className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">2. Upload Assets</h3>
        <FileInput 
          label="index.html" 
          file={appFiles.html} 
          onFileChange={(file) => onFileChange('html', file)}
          accept=".html"
        />
        <FileInput 
          label="main.js" 
          file={appFiles.js}
          onFileChange={(file) => onFileChange('js', file)}
          accept=".js"
        />
        <FileInput 
          label="app-icon.png" 
          file={appFiles.icon}
          onFileChange={(file) => onFileChange('icon', file)}
          accept="image/png, image/jpeg, image/svg+xml"
        />
      </div>

      <div>
          <h3 className="text-lg font-semibold text-white mb-3">3. Select Target Platform</h3>
          <PlatformSelector selectedPlatform={platform} onPlatformChange={onPlatformChange} />
      </div>

      <div className="pt-4 border-t border-slate-700">
        {error && <p className="text-red-400 text-sm mb-4 bg-red-900/50 p-3 rounded-md">{error}</p>}
        <button
          onClick={onPackage}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-900/50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Packaging...
            </>
          ) : (
            <>
              <PackageIcon className="h-6 w-6" />
              Package Application
            </>
          )}
        </button>
      </div>
    </div>
  );
};
