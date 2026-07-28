import { NextRequest, NextResponse } from 'next/server'; // Next.js server-side request and response objects
import { v2 as cloudinary } from 'cloudinary'; // Cloudinary SDK for Node.js
import { auth } from '@clerk/nextjs/server'; // authentication middleware from Clerk

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
    // Click 'View Credentials' below to copy your API secret
});

interface CloudinaryUploadResult {
    public_id: string;
    [key: string]: any
} // result of cloudinary upload api call 

export async function POST(request: NextRequest) {
    const {userId} = auth()

    if (!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401}) // not logged in
    }
    //there's a simpler way of uploading files to cloudinary using the cloudinary.uploader.upload() method, but it requires the file to be accessible via a URL. Since we are uploading files directly from the client, we need to use the upload_stream() method instead.
    try {
        const formData = await request.formData(); // parse the incoming request as form data
        const file = formData.get("file") as File | null; // get the file from the form data

        if(!file){
            return NextResponse.json({error: "File not found"}, {status: 400})
        }

        // file --> array buffer --> node.js buffer
        const bytes = await file.arrayBuffer() // convert the file to an array buffer
        const buffer = Buffer.from(bytes) // convert the array buffer to a Node.js buffer

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {folder: "next-cloudinary-uploads"},
                    (error, result) => {
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    } // handling the result of the upload
                )
                uploadStream.end(buffer) //  ends the stream and uploads the buffer to Cloudinary
            }
        )
        return NextResponse.json(
            {
                publicId: result.public_id
            },
            {
                status: 200
            }
        )

    } catch (error) {
        console.log("UPload image failed", error)
        return NextResponse.json({error: "Upload image failed"}, {status: 500})
    }

}
