
import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface FileInputProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
}

export const FileInput: React.FC<FileInputProps> = ({ label, file, onFileChange, accept }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-400">{label}</label>
      <div 
        className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md cursor-pointer hover:border-cyan-500 transition"
        onClick={handleFileSelect}
      >
        <div className="space-y-1 text-center">
          {file ? (
            <>
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
              <p className="text-sm text-slate-300 font-semibold">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
            </>
          ) : (
            <>
              <UploadIcon className="mx-auto h-12 w-12 text-slate-500" />
              <div className="flex text-sm text-slate-400">
                <p className="pl-1">Click to upload a file</p>
              </div>
              <p className="text-xs text-slate-500">{accept}</p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" className="hidden" onChange={handleInputChange} accept={accept} />
      </div>
    </div>
  );
};
