import React from 'react';

interface HeaderProps {
  onOpenMethodology: () => void;
  systemStatus: string;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand (Donezo Style) */}
        <div className="flex items-center space-x-3">
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl  tracking-tight text-[#111827]">
                AeroGrid
              </span>
            </div>
          </div>
        </div>

        
      </div>
    </header>
  );
};
