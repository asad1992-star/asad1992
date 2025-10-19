
import React from 'react';

interface OutputConsoleProps {
  buildLog: string;
  isLoading: boolean;
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({ buildLog, isLoading }) => {
  return (
    <div className="bg-black/50 p-6 rounded-lg border border-slate-700 h-full flex flex-col shadow-inner">
      <div className="flex items-center gap-2 border-b border-slate-600 pb-3 mb-4">
        <span className="h-3 w-3 bg-red-500 rounded-full"></span>
        <span className="h-3 w-3 bg-yellow-500 rounded-full"></span>
        <span className="h-3 w-3 bg-green-500 rounded-full"></span>
        <h2 className="text-lg font-semibold text-slate-300 ml-auto font-mono">Build Log</h2>
      </div>
      <div className="flex-grow bg-black rounded-md p-4 overflow-y-auto font-mono text-sm text-green-400 whitespace-pre-wrap min-h-[300px] lg:min-h-0">
        {isLoading && <p className="text-yellow-400 animate-pulse">Generating build log...</p>}
        {!isLoading && !buildLog && (
          <p className="text-slate-500">
            &gt; Build output will appear here after packaging...
            <br />
            &gt; Waiting for configuration.
          </p>
        )}
        {buildLog}
      </div>
    </div>
  );
};
