import React, { useEffect, useState } from 'react';

interface UploadProgressProps {
  isUploading: boolean;
  fileName: string;
  progress?: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ isUploading, fileName, progress = 0 }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isUploading) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isUploading]);

  if (!shouldRender) return null;

  return (
    <>
      <div 
        className={`fixed z-[200] transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        /* Mobile: Bottom center, full width with padding */
        bottom-4 left-4 right-4 
        /* Desktop: Bottom right, fixed width */
        md:bottom-6 md:right-6 md:left-auto md:w-96
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}
        `}
      >
        {/* Glass Container */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 relative overflow-hidden group">
            
            {/* Background Glows */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-2">
                
                {/* Header Row */}
                <div className="flex justify-between items-end mb-1">
                    <div className="flex flex-col overflow-hidden mr-4">
                        <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                           {/* Cloud Icon */}
                           <svg className="w-4 h-4 text-teal-400 shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                           </svg>
                           Uploading...
                        </h3>
                        <p className="text-xs text-gray-400 truncate font-medium mt-0.5">{fileName}</p>
                    </div>
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-indigo-400">
                        {Math.round(progress)}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-gray-700/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-500 transition-all duration-300 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 w-full -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                    </div>
                </div>

                {/* Warning Text */}
                <div className="mt-1 flex items-center justify-center gap-1.5 opacity-90">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">
                        Do not close the app
                    </p>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                </div>

            </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
};