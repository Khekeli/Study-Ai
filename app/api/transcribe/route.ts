import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  // Set CORS headers
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { audioData } = await request.json();
    const apiKey = process.env.ASSEMBLY_AI_API_KEY;

    if (!audioData) {
      return new NextResponse(
        JSON.stringify({ error: "No audio data provided" }),
        {
          status: 400,
          headers,
        }
      );
    }

    // 1. Upload audio to AssemblyAI
    const uploadResponse = await axios.post(
      "https://api.assemblyai.com/v2/upload",
      Buffer.from(audioData, "base64"),
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/octet-stream",
        },
      }
    );

    // 2. Start transcription
    const transcriptionResponse = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      {
        audio_url: uploadResponse.data.upload_url,
        speaker_labels: true,
      },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const transcriptId = transcriptionResponse.data.id;

    // 3. Poll for results
    let transcript;
    while (true) {
      const pollingResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        { headers: { Authorization: apiKey } }
      );

      transcript = pollingResponse.data;
      if (transcript.status === "completed") break;
      if (transcript.status === "failed") {
        throw new Error("Transcription failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return new NextResponse(
      JSON.stringify({ transcript: transcript.utterances }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error("Transcription error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers,
      }
    );
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new NextResponse(null, { headers });
}
