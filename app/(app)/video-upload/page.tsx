"use client"
import React, {useState} from 'react' // react hooks
import axios from 'axios' // axios for making HTTP requests
import { useRouter } from 'next/navigation' // react hook for navigation

function VideoUpload() {
    const [file, setFile] = useState<File | null>(null) // State to hold the selected video file
    const [title, setTitle] = useState("") // State to hold the title of the video
    const [description, setDescription] = useState("") // State to hold the description of the video
    const [isUploading, setIsUploading] = useState(false) // State to hold the uploading status
    const [error, setError] = useState<string | null>(null) // State for error messages

    const router = useRouter() // Hook to navigate to different pages --> home, upload, etc.

    // max file size of 100 MB (Cloudinary standard limit)
    const MAX_FILE_SIZE = 100 * 1024 * 1024

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault() // default form submission
        setError(null)
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setError(`File size too large. Maximum file size allowed is 100 MB (Selected file: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`)
            return;
        }
        setIsUploading(true)

        const formData = new FormData(); // Create a new FormData object to hold the file data
        formData.append("file", file);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("originalSize", file.size.toString());
        // add everything to form data to send to the server

        try {
            const response = await axios.post("/api/video-upload", formData) // Send the file to the server for uploading
            if (response.status === 200) {
                router.push("/") // Navigate to the home page after successful upload
            }
        } catch (err: any) {
            console.error("Video upload failed:", err)
            const serverErrorMessage = err?.response?.data?.error || err?.message || "Failed to upload video. Please try again."
            setError(serverErrorMessage)
        } finally{
            setIsUploading(false)
        }

    }


    return (
        <div className="container mx-auto p-4 max-w-2xl">
          <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
          
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered w-full"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Video File (Max 100 MB)</span>
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null)
                  setError(null)
                }}
                className="file-input file-input-bordered w-full"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  Uploading Video...
                </span>
              ) : (
                "Upload Video"
              )}
            </button>
          </form>
        </div>
      );
}

export default VideoUpload
