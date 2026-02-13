import React from 'react';

interface DeveloperCreditProps {
  showOnMobile: boolean;
}

export const DeveloperCredit: React.FC<DeveloperCreditProps> = ({ showOnMobile }) => {
  return (
    <div className={`
      /* LOGIC: Hidden on mobile unless 'showOnMobile' is true. Always visible on Desktop. */
      ${showOnMobile ? 'flex' : 'hidden'} md:flex
      
      /* MOBILE: Centered, Spaced less (my-4) */
      w-fit mx-auto my-4
      
      /* DESKTOP: Fixed to bottom-left corner */
      md:fixed md:bottom-4 md:left-4 md:z-[100] md:m-0
      
      pointer-events-none select-none animate-in fade-in slide-in-from-bottom-4 duration-1000
    `}>
      
      {/* THE DARK GLASS DESIGN */}
      <div className="
        relative overflow-hidden rounded-full 
        bg-gray-900/40 backdrop-blur-xl border border-white/10 
        shadow-[0_4px_20px_rgba(0,0,0,0.3)] 
        px-4 py-2 flex items-center gap-2.5 
        pointer-events-auto transition-all duration-300 
        hover:scale-105 hover:bg-gray-900/60 hover:shadow-indigo-500/20 hover:border-indigo-500/30 
        
        /* CHANGE IS HERE: */
        /* Mobile: Scaled down to 75% size */
        /* Desktop: Resets to 100% size */
        transform scale-75 md:scale-100
      ">
        
        {/* Animated Background Shine */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>

        {/* Code Icon Circle */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:rotate-12 transition-transform duration-300">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col leading-none">
          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Developed by</span>
          <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 filter drop-shadow-sm">
            Afif Hossain
          </span>
        </div>

        {/* Verified Badge */}
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-pulse"></div>
      </div>
    </div>
  );
};