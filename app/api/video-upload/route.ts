import { NextRequest, NextResponse } from 'next/server'; // Next.js server-side request and response objects
import { v2 as cloudinary } from 'cloudinary'; // sdk from coludinary
import { auth } from '@clerk/nextjs/server'; // authentication
import { PrismaClient } from '@prisma/client'; // prisma client for database operations


const prisma = new PrismaClient() 

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

export const maxDuration = 60; // Extended duration limit for large file uploads

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number
    [key: string]: any
} // result of cloudinary upload api call

export async function POST(request: NextRequest) {
    try {
        const {userId} = auth();
        if(!userId){
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        if(
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET)
            // check if cloudinary credentials are set or not
        {
            return NextResponse.json({error: "Cloudinary credentials not found"}, {status: 500})
        } 

        // data from req --> form data --> file, title, description, originalSize
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;

        if(!file){
            return NextResponse.json({error: "File not found"}, {status: 400})
        }
        // file --> array buffer --> node.js buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_chunked_stream(
                    {
                        resource_type: "video",
                        folder: "video-uploads",
                        chunk_size: 6 * 1024 * 1024 // 6MB chunks for large files
                    },
                    (error, result) => {
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer)
            }
        )
        const compressedBytes = (result.eager && result.eager.length > 0 && result.eager[0].bytes)
            ? String(result.eager[0].bytes)
            : String(Math.round(result.bytes * 0.7));

        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: compressedBytes,
                duration: result.duration || 0,
            }
        }) // prisma client creates a new video record in the database with the provided data 
        return NextResponse.json(video)

    } catch (error: any) {
        console.error("Upload video failed:", error)
        return NextResponse.json({error: error?.message || "Upload video failed"}, {status: 500})
    } finally{
        await prisma.$disconnect()
    }

}

