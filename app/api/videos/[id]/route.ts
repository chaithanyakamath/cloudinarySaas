import { NextRequest, NextResponse } from "next/server"; // req-res hook 
import { v2 as cloudinary } from "cloudinary"; // SDK from cloudinary
import { auth } from "@clerk/nextjs/server"; //authentication middleware from Clerk for Next.js
import prisma from "@/lib/prisma"; // prisma client instance to interact with the database

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}); //gets config details

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) 
//passing the req n id of the video to be deleted as params
{
  try {
    const { userId } = auth(); //user id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; //video id to be deleted
    if (!id) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const video = await prisma.video.findUnique({
      where: { id },
    }); // get video from given id

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Verify account ownership (or allow if video has default empty string from migration)
    if (video.userId && video.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this video" }, { status: 403 });
    } //ownership verification of the video

    // Delete video asset from Cloudinary
    if (video.publicId) {
      try {
        await cloudinary.uploader.destroy(video.publicId, {
          resource_type: "video",
        }); // delete video from cloudinary using publicId of the video in cloudinary
      } catch (cloudinaryErr) {
        console.error("Cloudinary delete warning:", cloudinaryErr);
      }
    }

    // Delete record from Prisma Database
    await prisma.video.delete({
      where: { id },
    }); // delete video from prisma database using video id

    return NextResponse.json({ message: "Video deleted successfully", id });//deleted
  } catch (error: any) {
    console.error("Delete video error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete video" },
      { status: 500 }
    );
  }
}
