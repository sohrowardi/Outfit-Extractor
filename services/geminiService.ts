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

const generateItemImage = async (base64Image: string, mimeType: string, item: ClothingItem, backgroundPrompt: string): Promise<TransformedImage> => {
    const isTransparent = backgroundPrompt.includes('transparent');
    const extractionPrompt = `From the provided original image, which may be a screenshot, isolate ONLY the '${item.description}'. Completely remove the person, other clothing, the original background, and any non-clothing elements such as text, icons, watermarks, or user interface elements. Place the isolated garment on ${backgroundPrompt}. The resulting image must be high-fidelity, preserving all original fabric textures, folds, colors, and details. Ensure the lighting on the garment appears natural and three-dimensional. ${isTransparent ? 'The resulting image MUST be a PNG with an alpha channel.' : 'The background should be suitable for a professional e-commerce fashion catalog.'}`;

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

const extractSingleItem = async (base64Image: string, mimeType: string, item: ClothingItem): Promise<TransformedImage> => {
    return generateItemImage(base64Image, mimeType, item, 'a clean, seamless, photorealistic white studio background');
}

const generateCompositeImage = async (base64Image: string, mimeType: string, items: ClothingItem[]): Promise<TransformedImage> => {
    const itemDescriptions = items.map(item => `'${item.description}'`).join(', ');
    const prompt = `From the provided original image, which may be a screenshot, extract ALL of the following items: ${itemDescriptions}. For each item, you must completely remove any non-clothing elements like text, icons, watermarks, or user interface elements present in the source. Arrange the cleaned items together aesthetically on a single, clean, seamless, photorealistic white studio background. This arrangement should resemble a professional fashion 'flat lay' or collection shot. Each item must maintain its high-fidelity, photorealistic quality, natural lighting, and three-dimensional appearance. Do not include the person or any other background elements.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: prompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return {
                name: "Complete Outfit",
                description: "A composite image of all extracted items.",
                imageUrl: `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`
            };
        }
    }
    throw new Error("The AI failed to generate the composite outfit image.");
};


export const transformClothingImage = async (imageFile: File): Promise<{ individualItems: TransformedImage[], compositeImage: TransformedImage }> => {
  try {
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type;

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

    const extractionPromises = identifiedItems.map(item => extractSingleItem(base64Image, mimeType, item));
    const compositePromise = generateCompositeImage(base64Image, mimeType, identifiedItems);

    const [compositeImage, ...individualItems] = await Promise.all([compositePromise, ...extractionPromises]);
    
    if (individualItems.length === 0) {
        throw new Error("The AI identified items but failed to generate any images.");
    }

    return { individualItems, compositeImage };

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

export const retryCompositeExtraction = async (imageFile: File, items: TransformedImage[]): Promise<TransformedImage> => {
    try {
        const base64Image = await fileToBase64(imageFile);
        const mimeType = imageFile.type;
        const clothingItems: ClothingItem[] = items.map(item => ({ itemName: item.name, description: item.description }));

        return await generateCompositeImage(base64Image, mimeType, clothingItems);
    } catch (error) {
        console.error("Error retrying composite extraction:", error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
            throw new Error("The retry request was blocked due to safety policies.");
        }
        throw new Error("Failed to re-process the composite image with the AI model.");
    }
};

export const editItemWithPrompt = async (imageFile: File, itemToChange: TransformedImage, userPrompt: string): Promise<TransformedImage> => {
    try {
        const base64Image = await fileToBase64(imageFile);
        const mimeType = imageFile.type;
        
        const editPrompt = `From the provided original image, which may be a screenshot, isolate ONLY the '${itemToChange.description}'. During isolation, you must completely remove any non-clothing elements like text, icons, watermarks, or user interface elements from the source image. 
        Once isolated, apply this modification: "${userPrompt}". 
        Finally, place the modified garment on a clean, seamless, photorealistic white studio background.
        If the modification requests a transparent background, the result MUST be a PNG with an alpha channel and a transparent background.
        The resulting image must be high-fidelity, preserving fabric textures, folds, and details, unless the modification specifies otherwise.`;

        const extractionResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: mimeType } },
                    { text: editPrompt }
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
                    name: itemToChange.name,
                    description: itemToChange.description,
                    imageUrl: `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`
                };
            }
        }
        throw new Error(`The AI failed to apply the edit for "${itemToChange.name}".`);
    } catch (error) {
        console.error("Error editing item with prompt:", error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
            throw new Error("The edit request was blocked due to safety policies.");
        }
        throw new Error("Failed to edit the item with the AI model.");
    }
};

export const changeItemBackground = async (imageFile: File, itemToChange: TransformedImage, background: string): Promise<TransformedImage> => {
    try {
        const base64Image = await fileToBase64(imageFile);
        const mimeType = imageFile.type;
        const clothingItem: ClothingItem = { itemName: itemToChange.name, description: itemToChange.description };
        
        let backgroundPrompt: string;
        switch (background) {
            case 'transparent':
                backgroundPrompt = 'a transparent background';
                break;
            case 'light gray':
                backgroundPrompt = 'a clean, seamless, photorealistic light gray studio background';
                break;
            default:
                backgroundPrompt = 'a clean, seamless, photorealistic white studio background';
        }

        return await generateItemImage(base64Image, mimeType, clothingItem, backgroundPrompt);
    } catch (error) {
        console.error("Error changing item background:", error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
            throw new Error("The background change request was blocked due to safety policies.");
        }
        throw new Error("Failed to change the item's background with the AI model.");
    }
};