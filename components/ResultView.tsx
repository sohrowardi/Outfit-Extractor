import React, { useState } from 'react';
import { TransformedImage } from '../types';

interface ResultViewProps {
  originalImage: string;
  transformedImages: TransformedImage[];
  compositeImage: TransformedImage | null;
  onReset: () => void;
  onRetryItem: (index: number) => void;
  onRetryComposite: () => void;
  onDownloadAll: () => void;
  onItemBackgroundChange: (index: number, background: string) => void;
  isDownloadingAll: boolean;
}

const ResultView: React.FC<ResultViewProps> = ({ originalImage, transformedImages, compositeImage, onReset, onRetryItem, onRetryComposite, onDownloadAll, onItemBackgroundChange, isDownloadingAll }) => {
  const [activePalette, setActivePalette] = useState<number | null>(null);
  const isAnyItemLoading = transformedImages.some(item => item.isLoading) || (compositeImage?.isLoading ?? false);
  
  const handlePaletteToggle = (index: number) => {
    setActivePalette(current => (current === index ? null : index));
  };

  const handleBackgroundSelect = (index: number, background: string) => {
    onItemBackgroundChange(index, background);
    setActivePalette(null);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 w-full mb-8">
        {/* Original Image Column */}
        <div className="flex flex-col items-center">
          <h3 className="text-2xl font-semibold mb-4 text-gray-300">Original</h3>
          <div className="w-full p-2 bg-gray-900/50 rounded-lg shadow-inner">
            <img
              src={originalImage}
              alt="Original upload"
              className="rounded-lg shadow-lg w-full h-auto object-contain max-h-[70vh]"
            />
          </div>
        </div>

        {/* Extracted Items Column */}
        <div className="flex flex-col">
          <h3 className="text-2xl font-semibold mb-4 text-gray-300 text-center">Extracted Items</h3>
          <div className="w-full h-[75vh] overflow-y-auto bg-gray-900/50 rounded-lg shadow-inner p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Composite Image Card */}
              {compositeImage && (
                 <div className="bg-gray-800/70 p-3 rounded-lg flex flex-col shadow-md border border-purple-500/50">
                    <div className="relative w-full aspect-square bg-white rounded-md mb-3">
                        <img
                            src={compositeImage.imageUrl}
                            alt={compositeImage.name}
                            className={`w-full h-full object-contain rounded-md transition-opacity duration-300 ${compositeImage.isLoading ? 'opacity-30' : 'opacity-100'}`}
                        />
                        {compositeImage.isLoading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md z-10">
                            <div className="w-8 h-8 border-2 border-t-purple-400 border-r-purple-400 border-gray-600 border-l-gray-600 rounded-full animate-spin"></div>
                          </div>
                        )}
                    </div>
                    <div className="text-sm font-medium text-center text-gray-300 flex-grow mb-2 min-h-[2.5rem] flex items-center justify-center">
                        <span className="flex-1 font-bold">{compositeImage.name}</span>
                        <button onClick={onRetryComposite} disabled={compositeImage.isLoading} className="ml-2 text-gray-400 hover:text-white transition-colors duration-200 p-1 disabled:opacity-50 disabled:cursor-not-allowed" title="Retry Outfit Generation">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" /></svg>
                        </button>
                    </div>
                    <a
                      href={compositeImage.imageUrl}
                      download={`${compositeImage.name.replace(/\s+/g, '_').toLowerCase()}.png`}
                      onClick={(e) => { if (compositeImage.isLoading) e.preventDefault(); }}
                      className={`w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md transition-all duration-300 text-xs flex items-center justify-center space-x-1.5 ${compositeImage.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Download</span>
                    </a>
                 </div>
              )}
              {/* Individual Item Cards */}
              {transformedImages.map((item, index) => (
                <div key={index} className="bg-gray-800/70 p-3 rounded-lg flex flex-col shadow-md border border-gray-700">
                  <div className="relative w-full aspect-square bg-white rounded-md mb-3">
                     <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={`w-full h-full object-contain rounded-md transition-opacity duration-300 ${item.isLoading ? 'opacity-30' : 'opacity-100'}`}
                      />
                      {item.isLoading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md z-10">
                          <div className="w-8 h-8 border-2 border-t-purple-400 border-r-purple-400 border-gray-600 border-l-gray-600 rounded-full animate-spin"></div>
                        </div>
                      )}
                  </div>
                  <div className="text-sm font-medium text-center text-gray-300 flex-grow mb-2 min-h-[2.5rem] flex items-center justify-center">
                    <span className="flex-1">{item.name}</span>
                     <button onClick={() => handlePaletteToggle(index)} className="ml-2 text-gray-400 hover:text-white transition-colors duration-200 p-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                     </button>
                  </div>
                  {activePalette === index && (
                     <div className="mb-2 p-2 bg-gray-900/50 rounded-md">
                        <p className="text-xs text-center text-gray-400 mb-2">Change Background</p>
                        <div className="flex justify-center items-center space-x-3">
                           <button title="White Background" onClick={() => handleBackgroundSelect(index, 'white')} className="w-6 h-6 rounded-full bg-white border-2 border-gray-400 hover:scale-110 transition-transform"></button>
                           <button title="Light Gray Background" onClick={() => handleBackgroundSelect(index, 'light gray')} className="w-6 h-6 rounded-full bg-gray-300 border-2 border-gray-500 hover:scale-110 transition-transform"></button>
                           <button title="Transparent Background" onClick={() => handleBackgroundSelect(index, 'transparent')} className="w-6 h-6 rounded-full border-2 border-gray-400 hover:scale-110 transition-transform" style={{background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\' viewBox=\'0 0 8 8\'%3E%3Cg fill=\'%23808080\' fill-opacity=\'0.4\'%3E%3Cpath fill-rule=\'evenodd\' d=\'M0 0h4v4H0V0zm4 4h4v4H4V4z\'/%3E%3C/g%3E%3C/svg%3E")'}}>
                           </button>
                        </div>
                     </div>
                  )}
                  <div className="mt-auto flex items-center space-x-3">
                    <a
                      href={item.imageUrl}
                      download={`${item.name.replace(/\s+/g, '_').toLowerCase()}.png`}
                      onClick={(e) => { if (item.isLoading) e.preventDefault(); }}
                      className={`flex-grow text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md transition-all duration-300 text-xs flex items-center justify-center space-x-1.5 ${item.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Download</span>
                    </a>
                    <button
                        onClick={() => onRetryItem(index)}
                        disabled={item.isLoading}
                        title="Try Again"
                        className="flex-shrink-0 bg-transparent hover:bg-gray-700/50 text-gray-300 hover:text-white font-bold p-2 rounded-md transition-all duration-300 border border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onReset}
          className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 text-lg flex items-center justify-center space-x-2"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" /></svg>
          <span>Start Over</span>
        </button>
        <button
          onClick={onDownloadAll}
          disabled={isDownloadingAll || isAnyItemLoading}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloadingAll ? (
            <>
              <div className="w-5 h-5 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <span>Zipping...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Download All</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResultView;