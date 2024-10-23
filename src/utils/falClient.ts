// src/utils/falClient.ts

import { fal } from "@fal-ai/client";

const apiKey = process.env.FAL_API_KEY;

// console.log(
//   "FAL API Key (first 10 chars):",
//   apiKey ? apiKey.slice(0, 10) + "..." : "Not set"
// );

if (!apiKey) {
  throw new Error("FAL_API_KEY is not set in environment variables");
}

fal.config({
  credentials: apiKey,
});

export default fal;
