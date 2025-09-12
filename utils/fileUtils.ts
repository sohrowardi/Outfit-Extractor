import JSZip from 'jszip';
import { TransformedImage } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // result is "data:mime/type;base64,the_base_64_string"
          // we need to remove the prefix
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to read file as base64 string.'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
export const createAndDownloadZip = async (images: TransformedImage[]): Promise<void> => {
  const zip = new JSZip();

  const imagePromises = images.map(async (image) => {
    const response = await fetch(image.imageUrl);
    const blob = await response.blob();
    const extension = blob.type.split('/')[1] || 'png';
    const filename = `${image.name.replace(/\s+/g, '_').toLowerCase()}.${extension}`;
    zip.file(filename, blob);
  });

  await Promise.all(imagePromises);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'outfit-extractor-results.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};