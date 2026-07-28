import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const maxDuration = 60;

interface CloudinaryUploadResult {
  public_id: string;
  bytes: number;
  duration?: number;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json({ error: "Cloudinary credentials missing" }, { status: 500 });
    }

    const contentType = request.headers.get("content-type") || "";

    // Direct Upload Mode: Client uploaded file directly to Cloudinary and sends JSON metadata
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { publicId, title, description, originalSize, duration, bytes } = body;

      if (!publicId || !title) {
        return NextResponse.json({ error: "Missing required video parameters" }, { status: 400 });
      }

      const origSizeStr = String(originalSize || bytes || "0");
      const compBytesStr = String(Math.round((Number(bytes) || Number(originalSize) || 0) * 0.7));

      const video = await prisma.video.create({
        data: {
          userId,
          title,
          description: description || "",
          publicId,
          originalSize: origSizeStr,
          compressedSize: compBytesStr,
          duration: Number(duration) || 0,
        },
      });

      return NextResponse.json(video);
    }

    // Fallback: Legacy FormData Server Streaming Mode (for small files)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_chunked_stream(
        {
          resource_type: "video",
          folder: "video-uploads",
          chunk_size: 6 * 1024 * 1024,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        }
      );
      uploadStream.end(buffer);
    });

    const compressedBytes =
      result.eager && result.eager.length > 0 && result.eager[0].bytes
        ? String(result.eager[0].bytes)
        : String(Math.round(result.bytes * 0.7));

    const video = await prisma.video.create({
      data: {
        userId,
        title,
        description: description || "",
        publicId: result.public_id,
        originalSize: originalSize || String(result.bytes),
        compressedSize: compressedBytes,
        duration: result.duration || 0,
      },
    });

    return NextResponse.json(video);
  } catch (error: any) {
    console.error("Upload video failed:", error);
    return NextResponse.json(
      { error: error?.message || "Upload video failed" },
      { status: 500 }
    );
  }
}
