import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import type { GeneratedContent } from '../types';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  dangerouslyAllowBrowser: true,
});

// Helper to convert base64 to File-like object
async function base64ToFile(base64Data: string, filename: string, mimeType: string) {
  const buffer = Buffer.from(base64Data, 'base64');
  return await toFile(buffer, filename, { type: mimeType });
}

export async function editImage(
    base64ImageData: string, 
    mimeType: string, 
    prompt: string,
    maskBase64: string | null,
    secondaryImage: { base64: string; mimeType: string } | null
): Promise<GeneratedContent> {
  try {
    // Scenario 1: Image Editing with Mask (DALL-E 2)
    if (maskBase64) {
      const imageFile = await base64ToFile(base64ImageData, 'image.png', mimeType);
      const maskFile = await base64ToFile(maskBase64, 'mask.png', 'image/png');

      const response = await openai.images.edit({
        image: imageFile,
        mask: maskFile,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });

      const b64Json = response.data?.[0]?.b64_json;
      if (b64Json) {
        return {
          imageUrl: `data:image/png;base64,${b64Json}`,
          text: null
        };
      } else {
        throw new Error("Failed to generate image.");
      }
    }
    
    // Scenario 2: Vision / Chat with Image (GPT-4o)
    // If no mask is provided, we assume the user wants to chat about the image or analyze it,
    // because OpenAI doesn't support "instruct-pix2pix" style full image editing via API easily yet.
    // We will use GPT-4o to handle this multimodal request.
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64ImageData}`,
            },
          },
        ],
      },
    ];

    if (secondaryImage) {
        (messages[0].content as any[]).push({
            type: "image_url",
            image_url: {
                url: `data:${secondaryImage.mimeType};base64,${secondaryImage.base64}`,
            },
        });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.IMAGE_MODEL || "gpt-4o",
      messages: messages,
    });

    const textResponse = completion.choices[0].message.content;
    
    return {
      imageUrl: null,
      text: textResponse,
    };

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while communicating with the OpenAI API.");
  }
}

export async function generateVideo(
    prompt: string,
    image: { base64: string; mimeType: string } | null,
    aspectRatio: '16:9' | '9:16',
    onProgress: (message: string) => void
): Promise<string> {
    // OpenAI does not currently offer a public Video Generation API (Sora) comparable to Google's Veo/Imagen Video 
    // in the standard SDK as of early 2025 (or at least not without special access).
    // For now, we will throw a clear error.
    
    onProgress("Video generation is not supported by the OpenAI service yet.");
    throw new Error("OpenAI video generation is currently not available.");
}
