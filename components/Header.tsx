
import React from 'react';
import { CubeIcon } from './icons/CubeIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm shadow-lg p-4 border-b border-slate-700">
      <div className="container mx-auto flex items-center gap-4">
        <CubeIcon className="h-10 w-10 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Offline App Packager</h1>
          <p className="text-sm text-slate-400">Package your web project into a simulated offline application.</p>
        </div>
      </div>
    </header>
  );
};
