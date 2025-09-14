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
      <div className="flex space-x-2 mb-6" role="status" aria-label="Processing your image...">
        <div className="w-4 h-4 bg-[#ff91af] rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
        <div className="w-4 h-4 bg-[#ff91af] rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
        <div className="w-4 h-4 bg-[#ff91af] rounded-full animate-bounce"></div>
      </div>
      <h2 className="text-2xl font-semibold text-[#ff91af] mb-2">Creating Your Catalog</h2>
      <p className="text-gray-400 transition-opacity duration-500 ease-in-out">
        {processingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default ProcessingView;