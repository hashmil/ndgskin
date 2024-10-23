// src/app/api/generateTexture/route.ts

import { NextRequest, NextResponse } from "next/server";
import fal from "@/utils/falClient"; // Adjust the import path as necessary

export async function POST(req: NextRequest) {
  const { prompt, seed } = await req.json(); // Assume seed is optional, otherwise set a default

  try {
    console.log("Calling FAL AI with prompt:", prompt);

    // Subscribe to FAL AI model for image generation
    const result = await fal.subscribe("fal-ai/fast-sdxl", {
      input: {
        prompt,
        seed: seed || Date.now(), // If seed is not provided, use the current timestamp
        image_size: "square_hd", // Set image size to square
        num_images: 1, // Adjust as necessary
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log("API Response:", result.data);
    console.log("Request ID:", result.requestId);

    // Check if the result contains images
    if (!result.data.images || result.data.images.length === 0) {
      throw new Error("No images returned from FAL AI");
    }

    // Extract the image URL
    const generatedTextureUrl = result.data.images[0].url;

    return NextResponse.json({ images: [{ url: generatedTextureUrl }] });
  } catch (error: any) {
    console.error("Error generating texture:", error);
    return NextResponse.json(
      { error: "Failed to generate texture", details: error.message },
      { status: 500 }
    );
  }
}
