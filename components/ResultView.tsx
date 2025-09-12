import React, { useState, useEffect, useRef } from 'react';
import { TransformedImage } from '../types';

interface ResultViewProps {
  originalImage: string;
  transformedImages: TransformedImage[];
  compositeImage: TransformedImage | null;
  onReset: () => void;
  onRetryItem: (index: number) => void;
  onRetryComposite: () => void;
  onDownloadAll: () => void;
  onItemEdit: (index: number, prompt: string) => void;
  onEditComposite: (prompt: string) => void;
  onBatchBackgroundChange: (background: string) => void;
  isDownloadingAll: boolean;
}

const ResultView: React.FC<ResultViewProps> = ({ originalImage, transformedImages, compositeImage, onReset, onRetryItem, onRetryComposite, onDownloadAll, onItemEdit, onEditComposite, onBatchBackgroundChange, isDownloadingAll }) => {
  const [editingState, setEditingState] = useState<{ index: number | null; text: string }>({ index: null, text: '' });
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false);
  const isAnyItemLoading = transformedImages.some(item => item.isLoading) || (compositeImage?.isLoading ?? false);
  const batchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (batchMenuRef.current && !batchMenuRef.current.contains(event.target as Node)) {
            setIsBatchMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEditToggle = (index: number) => {
    setEditingState(current => ({
      index: current.index === index ? null : index,
      text: ''
    }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingState.index !== null && editingState.text.trim()) {
      if (editingState.index === -1) {
        onEditComposite(editingState.text);
      } else {
        onItemEdit(editingState.index, editingState.text);
      }
      setEditingState({ index: null, text: '' });
    }
  };
  
  const handleBatchBackgroundSelect = (background: string) => {
    onBatchBackgroundChange(background);
    setIsBatchMenuOpen(false);
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
                         <button onClick={() => handleEditToggle(-1)} className="ml-2 text-gray-400 hover:text-white transition-colors duration-200 p-1" title="Edit Item">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                         </button>
                    </div>
                    {editingState.index === -1 && (
                        <form onSubmit={handleEditSubmit} className="mb-2 p-2 bg-gray-900/50 rounded-md space-y-2">
                            <input
                                type="text"
                                value={editingState.text}
                                onChange={(e) => setEditingState({ ...editingState, text: e.target.value })}
                                placeholder="e.g., Change background"
                                className="w-full bg-gray-700 text-white text-xs p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                autoFocus
                            />
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingState({ index: null, text: '' })}
                                    className="text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 font-semibold py-1 px-3 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50"
                                    disabled={!editingState.text.trim() || compositeImage.isLoading}
                                >
                                    Apply
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="mt-auto flex items-center space-x-3">
                      <a
                        href={compositeImage.imageUrl}
                        download={`${compositeImage.name.replace(/\s+/g, '_').toLowerCase()}.png`}
                        onClick={(e) => { if (compositeImage.isLoading) e.preventDefault(); }}
                        className={`flex-grow text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-md transition-all duration-300 text-xs flex items-center justify-center space-x-1.5 ${compositeImage.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Download</span>
                      </a>
                      <button
                          onClick={onRetryComposite}
                          disabled={compositeImage.isLoading}
                          title="Try Again"
                          className="flex-shrink-0 bg-transparent hover:bg-gray-700/50 text-gray-300 hover:text-white font-bold p-2 rounded-md transition-all duration-300 border border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.12M20 15a9 9 0 01-14.13 5.12" /></svg>
                      </button>
                    </div>
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
                     <button onClick={() => handleEditToggle(index)} className="ml-2 text-gray-400 hover:text-white transition-colors duration-200 p-1" title="Edit Item">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                     </button>
                  </div>
                  {editingState.index === index && (
                    <form onSubmit={handleEditSubmit} className="mb-2 p-2 bg-gray-900/50 rounded-md space-y-2">
                        <input
                            type="text"
                            value={editingState.text}
                            onChange={(e) => setEditingState({ ...editingState, text: e.target.value })}
                            placeholder="e.g., Change color to blue"
                            className="w-full bg-gray-700 text-white text-xs p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setEditingState({ index: null, text: '' })}
                                className="text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 font-semibold py-1 px-3 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50"
                                disabled={!editingState.text.trim() || item.isLoading}
                            >
                                Apply
                            </button>
                        </div>
                    </form>
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
        <div className="relative" ref={batchMenuRef}>
            <button
                onClick={() => setIsBatchMenuOpen(prev => !prev)}
                disabled={isAnyItemLoading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <span>Batch Edit</span>
            </button>
            {isBatchMenuOpen && (
                <div className="absolute bottom-full mb-2 w-full sm:w-64 bg-gray-700 border border-gray-600 rounded-lg shadow-xl py-2 z-20">
                    <p className="text-sm font-semibold text-gray-300 px-4 pb-2 border-b border-gray-600">Apply to all items:</p>
                    <ul className="text-gray-300">
                        <li>
                            <button onClick={() => handleBatchBackgroundSelect('white')} className="w-full text-left px-4 py-2 text-sm hover:bg-purple-600 hover:text-white transition-colors duration-200">
                                Change background to White
                            </button>
                        </li>
                        <li>
                            <button onClick={() => handleBatchBackgroundSelect('light gray')} className="w-full text-left px-4 py-2 text-sm hover:bg-purple-600 hover:text-white transition-colors duration-200">
                                Change background to Light Gray
                            </button>
                        </li>
                        <li>
                            <button onClick={() => handleBatchBackgroundSelect('transparent')} className="w-full text-left px-4 py-2 text-sm hover:bg-purple-600 hover:text-white transition-colors duration-200">
                                Change background to Transparent
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
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