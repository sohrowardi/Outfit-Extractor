import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import { AppState, TransformedImage } from './types';
import { transformClothingImage, retryExtraction, changeItemBackground, retryCompositeExtraction, editItemWithPrompt, editCompositeWithPrompt } from './services/geminiService';
import { createAndDownloadZip } from './utils/fileUtils';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [transformedImages, setTransformedImages] = useState<TransformedImage[] | null>(null);
  const [compositeImage, setCompositeImage] = useState<TransformedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const handleImageUpload = useCallback(async (file: File) => {
    setOriginalImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setAppState(AppState.PROCESSING);
    setError(null);
    setTransformedImages(null);
    setCompositeImage(null);

    try {
      const { individualItems, compositeImage } = await transformClothingImage(file);
      setTransformedImages(individualItems);
      setCompositeImage(compositeImage);
      setAppState(AppState.RESULT);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState(AppState.IDLE);
    setOriginalImage(null);
    if(originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    setOriginalImageUrl(null);
    setTransformedImages(null);
    setCompositeImage(null);
    setError(null);
  }, [originalImageUrl]);

  const handleRetryItem = useCallback(async (index: number) => {
    if (!originalImage || !transformedImages) return;

    const itemToRetry = transformedImages[index];

    setTransformedImages(current =>
      current!.map((item, i) => i === index ? { ...item, isLoading: true } : item)
    );

    try {
      const newItem = await retryExtraction(originalImage, itemToRetry);

      setTransformedImages(current =>
        current!.map((item, i) => i === index ? { ...newItem, isLoading: false } : item)
      );
    } catch (err) {
      console.error("Retry failed:", err);
      setTransformedImages(current =>
        current!.map((item, i) => i === index ? { ...item, isLoading: false } : item)
      );
    }
  }, [originalImage, transformedImages]);
  
  const handleRetryComposite = useCallback(async () => {
    if (!originalImage || !transformedImages) return;

    setCompositeImage(current => current ? { ...current, isLoading: true } : null);

    try {
      const newComposite = await retryCompositeExtraction(originalImage, transformedImages);
      setCompositeImage({ ...newComposite, isLoading: false });
    } catch (err) {
      console.error("Composite retry failed:", err);
      setCompositeImage(current => current ? { ...current, isLoading: false } : null);
    }
  }, [originalImage, transformedImages]);

  const handleItemEdit = useCallback(async (index: number, prompt: string) => {
    if (!originalImage || !transformedImages || !prompt) return;

    const itemToEdit = transformedImages[index];

    setTransformedImages(current =>
      current!.map((item, i) => (i === index ? { ...item, isLoading: true } : item))
    );

    try {
      const newItem = await editItemWithPrompt(originalImage, itemToEdit, prompt);
      setTransformedImages(current =>
        current!.map((item, i) => (i === index ? { ...newItem, isLoading: false } : item))
      );
    } catch (err) {
      console.error("Item edit failed:", err);
      setTransformedImages(current =>
        current!.map((item, i) => (i === index ? { ...item, isLoading: false } : item))
      );
    }
  }, [originalImage, transformedImages]);

  const handleCompositeEdit = useCallback(async (prompt: string) => {
    if (!originalImage || !transformedImages || !prompt) return;

    setCompositeImage(current => current ? { ...current, isLoading: true } : null);

    try {
        const newComposite = await editCompositeWithPrompt(originalImage, transformedImages, prompt);
        setCompositeImage({ ...newComposite, isLoading: false });
    } catch (err) {
        console.error("Composite edit failed:", err);
        setCompositeImage(current => current ? { ...current, isLoading: false } : null);
    }
  }, [originalImage, transformedImages]);

  const handleBatchBackgroundChange = useCallback(async (background: string) => {
    if (!originalImage || !transformedImages) return;

    setTransformedImages(current =>
      current!.map(item => ({ ...item, isLoading: true }))
    );

    try {
      const newItems = await Promise.all(
        transformedImages.map(item => changeItemBackground(originalImage, item, background))
      );
      setTransformedImages(newItems.map(item => ({ ...item, isLoading: false })));
    } catch (err) {
      console.error("Batch background change failed:", err);
      setTransformedImages(current =>
        current!.map(item => ({ ...item, isLoading: false }))
      );
    }
  }, [originalImage, transformedImages]);


  const handleDownloadAll = useCallback(async () => {
    if (!transformedImages || transformedImages.length === 0) return;
    
    setIsZipping(true);
    try {
      await createAndDownloadZip(transformedImages);
    } catch (err) {
      console.error("Failed to create zip:", err);
      setError("Failed to create the download file. Please try downloading items individually.");
    } finally {
      setIsZipping(false);
    }
  }, [transformedImages]);

  const renderContent = () => {
    switch (appState) {
      case AppState.PROCESSING:
        return <ProcessingView />;
      case AppState.RESULT:
        if (!originalImageUrl || !transformedImages || transformedImages.length === 0) {
            setError("Something went wrong displaying the results.");
            setAppState(AppState.ERROR);
            return <ImageUploader onImageUpload={handleImageUpload} error={error} />;
        }
        return (
          <ResultView
            originalImage={originalImageUrl}
            transformedImages={transformedImages}
            compositeImage={compositeImage}
            onReset={handleReset}
            onRetryItem={handleRetryItem}
            onRetryComposite={handleRetryComposite}
            onDownloadAll={handleDownloadAll}
            onItemEdit={handleItemEdit}
            onEditComposite={handleCompositeEdit}
            onBatchBackgroundChange={handleBatchBackgroundChange}
            isDownloadingAll={isZipping}
          />
        );
      case AppState.ERROR:
        return <ImageUploader onImageUpload={handleImageUpload} error={error} onReset={handleReset} />;
      case AppState.IDLE:
      default:
        return <ImageUploader onImageUpload={handleImageUpload} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#ff91af]">
          Outfit Extractor
        </h1>
        <p className="text-[#ff91af] opacity-90 mt-2 text-lg">
          Transform your clothing photos into a professional catalog.
        </p>
      </header>
      <main className="w-full max-w-7xl">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center mt-8 text-gray-400 text-sm">
        <p>Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;