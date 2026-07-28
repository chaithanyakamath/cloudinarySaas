import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
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

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "video-uploads";

    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder,
    });
  } catch (error: any) {
    console.error("Signature generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
