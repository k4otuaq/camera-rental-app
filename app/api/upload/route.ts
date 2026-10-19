import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file selected for upload." },
        { status: 400 }
      );
    }

    // Limit file size to 4MB to prevent excessive DB storage payload
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 4MB limit. Please choose a smaller image." },
        { status: 400 }
      );
    }

    // Convert file buffer to Base64 Data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";
    const base64ImageUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      imageUrl: base64ImageUrl,
    });
  } catch (error: any) {
    console.error("Image upload processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process uploaded image." },
      { status: 500 }
    );
  }
}
