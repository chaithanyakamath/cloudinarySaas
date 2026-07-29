import { NextRequest, NextResponse } from "next/server"; // hook to manage requests and responses in Next.js API routes
import { auth } from "@clerk/nextjs/server"; // hook to manage authentication and authorization in Next.js API routes
import prisma from "@/lib/prisma"; // import the Prisma client instance to interact with the database

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth(); //userid to fetch associated videos from the database
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //fetching is done using prisma client instance to fetch all videos associated with the authenticated user
    const videos = await prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }); // Fetch all videos associated with the authenticated user, ordered by creation date in descending order

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Error fetching videos" }, { status: 500 });
  }
} // returns a JSON response containing the list of videos associated with the authenticated user, or an error message if an error occurs during the process.
