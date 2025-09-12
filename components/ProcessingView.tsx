import React, { useState, useEffect } from 'react';

const processingMessages = [
  "Warming up the AI stylist...",
  "Analyzing your photo for all clothing items...",
  "Identifying garments and accessories...",
  "This can take a moment, the AI is working hard...",
  "Extracting each item one by one...",
  "Placing items on a professional backdrop...",
  "Assembling your virtual closet...",
  "Finalizing your catalog...",
];

const ProcessingView: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % processingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
      <div className="w-16 h-16 border-4 border-t-purple-400 border-r-purple-400 border-b-gray-600 border-l-gray-600 rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-semibold text-gray-200 mb-2">Creating Your Catalog</h2>
      <p className="text-gray-400 transition-opacity duration-500 ease-in-out">
        {processingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default ProcessingView;
