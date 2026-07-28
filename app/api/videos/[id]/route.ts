import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Verify account ownership (or allow if video has default empty string from migration)
    if (video.userId && video.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this video" }, { status: 403 });
    }

    // Delete video asset from Cloudinary
    if (video.publicId) {
      try {
        await cloudinary.uploader.destroy(video.publicId, {
          resource_type: "video",
        });
      } catch (cloudinaryErr) {
        console.error("Cloudinary delete warning:", cloudinaryErr);
      }
    }

    // Delete record from Prisma Database
    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Video deleted successfully", id });
  } catch (error: any) {
    console.error("Delete video error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete video" },
      { status: 500 }
    );
  }
}
