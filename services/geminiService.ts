import { GoogleGenAI, Modality, Type } from "@google/genai";
import { fileToBase64 } from "../utils/fileUtils";
import { TransformedImage } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ClothingItem {
  itemName: string;
  description: string;
}

const extractSingleItem = async (base64Image: string, mimeType: string, item: ClothingItem): Promise<TransformedImage> => {
    const extractionPrompt = `From the provided original image, isolate ONLY the '${item.description}'. Completely remove the person, other clothing, and the original background. Place the isolated garment on a clean, seamless, photorealistic white studio background. The resulting image must be high-fidelity, preserving all original fabric textures, folds, colors, and details. Ensure the lighting on the garment appears natural and three-dimensional, suitable for a professional e-commerce fashion catalog.`;

    const extractionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: extractionPrompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
    });
    
    for (const part of extractionResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return {
                name: item.itemName,
                description: item.description,
                imageUrl: `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`
            };
        }
    }
    throw new Error(`The AI failed to generate an image for "${item.itemName}".`);
}

export const transformClothingImage = async (imageFile: File): Promise<TransformedImage[]> => {
  try {
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type;

    // Step 1: Identify all clothing items
    const identificationPrompt = "Analyze this image and identify every distinct clothing item and accessory worn by the person. For each item, provide a short, descriptive name (e.g., 'Blue Denim Jeans'). Respond with a JSON array of objects, where each object has 'itemName' and 'description' properties.";
    
    const identificationResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: identificationPrompt }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        itemName: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["itemName", "description"]
                }
            }
        }
    });

    const identifiedItems: ClothingItem[] = JSON.parse(identificationResponse.text);

    if (!identifiedItems || identifiedItems.length === 0) {
        throw new Error("The AI could not identify any clothing items in the image.");
    }

    // Step 2: Extract each item individually
    const extractionPromises = identifiedItems.map(item => extractSingleItem(base64Image, mimeType, item));
    const transformedImages = await Promise.all(extractionPromises);
    
    if (transformedImages.length === 0) {
        throw new Error("The AI identified items but failed to generate any images.");
    }

    return transformedImages;

  } catch (error) {
    console.error("Error transforming image:", error);
    if (error instanceof Error && error.message.includes('SAFETY')) {
        throw new Error("The request was blocked due to safety policies. Please try a different image.");
    }
    if (error instanceof SyntaxError) {
        throw new Error("The AI failed to identify items in a structured way. Please try a different image.");
    }
    throw new Error("Failed to process the image with the AI model.");
  }
};

export const retryExtraction = async (imageFile: File, itemToRetry: { name: string, description: string }): Promise<TransformedImage> => {
    try {
        const base64Image = await fileToBase64(imageFile);
        const mimeType = imageFile.type;
        const clothingItem: ClothingItem = { itemName: itemToRetry.name, description: itemToRetry.description };

        return await extractSingleItem(base64Image, mimeType, clothingItem);
    } catch (error) {
        console.error("Error retrying extraction:", error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
            throw new Error("The retry request was blocked due to safety policies.");
        }
        throw new Error("Failed to re-process the item with the AI model.");
    }
};
