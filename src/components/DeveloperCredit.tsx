import React, { useState, useEffect } from 'react';

interface DeveloperCreditProps {
  showOnMobile: boolean;
  isCoverGeneratorActive?: boolean;
}

export const DeveloperCredit: React.FC<DeveloperCreditProps> = ({ 
  showOnMobile, 
  isCoverGeneratorActive = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // 1. Scroll Detection
  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
      setIsAtBottom(scrolledToBottom);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Auto-close logic
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 4000); 
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <div 
      onClick={() => setIsExpanded(true)}
      className={`
        ${showOnMobile ? 'flex' : 'hidden'} md:flex
        absolute 
        
        /* --- Z-INDEX LOGIC --- */
        /* Mobile: Low (0) to stay behind overlays */
        /* PC: High (9999) to stay on top */
        z-20 md:z-[9999]
        
        /* --- POSITIONING --- */
        /* Mobile: Drops down if Cover Generator is active */
        ${isCoverGeneratorActive ? 'top-20' : 'top-6'} 
        right-3

        /* PC: Fixed at bottom left */
        md:fixed md:bottom-4 md:left-4 md:top-auto md:right-auto

        items-center justify-center
        cursor-pointer md:cursor-default
        transition-all duration-700 ease-out
        
        ${(isAtBottom || isExpanded) ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}
        md:translate-y-0 md:opacity-100 md:pointer-events-auto
      `}
    >
      
      {/* THE CONTAINER */}
      <div className={`
        relative flex items-center justify-center
        transition-all duration-700 cubic-bezier(0.23, 1, 0.32, 1)
        ${isExpanded 
          ? 'w-[200px] h-12 rounded-full bg-gray-900/40 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
          : 'w-12 h-12 rounded-full bg-transparent'
        }
        md:w-auto md:h-auto md:rounded-full
        md:bg-gray-900/40 md:backdrop-blur-xl md:border md:border-white/10 
        md:shadow-[0_4px_20px_rgba(0,0,0,0.3)] 
        md:px-4 md:py-2
      `}>
        
        {/* MOBILE BULB ICON */}
        <div className={`
            absolute inset-0 flex items-center justify-center transition-all duration-500
            ${isExpanded ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'}
            md:hidden
        `}>
            <svg 
                className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse" 
                fill="currentColor" 
                viewBox="0 0 24 24"
            >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"/>
            </svg>
        </div>


        {/* CREDIT CONTENT */}
        <div className={`
          flex items-center gap-2.5 whitespace-nowrap overflow-hidden
          transition-all duration-500
          ${isExpanded ? 'opacity-100 w-auto delay-100' : 'opacity-0 w-0'}
          md:opacity-100 md:w-auto md:delay-0
        `}>

            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>

            <div className="flex flex-col leading-none text-left">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Developed by</span>
              <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 filter drop-shadow-sm">
                Afif Hossain
              </span>
            </div>

            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-pulse ml-1 shrink-0"></div>
        </div>

      </div>
    </div>
  );
};