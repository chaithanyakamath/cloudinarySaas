import { NextRequest, NextResponse } from "next/server"; // hooks to handle incoming requests and send responses
import { v2 as cloudinary } from "cloudinary"; // SDK from cloudinary
import { auth } from "@clerk/nextjs/server"; //authentication middleware from Clerk for Next.js

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}); // config coudinary from .env file

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth(); // get userid
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json({ error: "Cloudinary credentials missing" }, { status: 500 }); // unauthorized if cloudinary credentials are missing
    }

    const timestamp = Math.round(new Date().getTime() / 1000); // get current timestamp in seconds
    const folder = "video-uploads"; // folder in cloudinary where videos will be uploaded

    const paramsToSign = {
      timestamp,
      folder,
    }; // parameters to be signed for secure upload to Cloudinary

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    ); // paramaters to be signed with cloudinary secret to generate signature for secure upload

    return NextResponse.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder,
    }); // returned values to frontend for direct upload to Cloudinary
  } catch (error: any) {
    console.error("Signature generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
