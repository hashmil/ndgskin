import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  console.log("Received input for prompt generation:", input); // Log the input

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Convert the following description into a short prompt for AI image generation, keep it simple and concise. Prompt should start with "a seamless illustrated vector pattern of ": ${input}`,
        },
      ],
    });

    const choices = response.choices;
    if (!choices || choices.length === 0) {
      throw new Error("No choices returned from OpenAI API.");
    }

    const message = choices[0].message;
    if (!message || !message.content) {
      throw new Error("OpenAI response message content is null or undefined.");
    }

    const seamlessPatternPrompt = message.content.trim();
    console.log("Generated seamless pattern prompt:", seamlessPatternPrompt);
    return NextResponse.json({ seamlessPatternPrompt });
  } catch (error) {
    console.error("Error generating prompt:", error); // Log any errors
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
