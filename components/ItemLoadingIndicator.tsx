import React from 'react';

const ItemLoadingIndicator: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gray-800/50 flex flex-col items-center justify-center rounded-md z-10 p-3" aria-label="Loading image" role="status">
      {/* Pulsing skeleton background */}
      <div className="w-full h-full bg-gray-700/80 rounded-lg animate-pulse"></div>
      
      {/* Spinner and text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="w-8 h-8 border-2 border-t-[#ff91af] border-r-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-gray-200 mt-2">Updating...</p>
      </div>
    </div>
  );
};

export default ItemLoadingIndicator;
