"use client";

import React, { useState } from "react"; // react hook for managing state in functional components
import axios from "axios"; // hook for making HTTP requests to the backend API
import { useRouter } from "next/navigation"; // hook for programmatic navigation in Next.js applications
import { Upload, Film, FileVideo, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"; //lucide icon hooks for icons
import { formatBytes } from "@/lib/utils"; // utility function to format bytes into a human-readable string

function VideoUpload() {
  const [file, setFile] = useState<File | null>(null); // state to store the selected video file
  const [title, setTitle] = useState(""); // state to store the video title
  const [description, setDescription] = useState(""); // state to store the video description
  const [isUploading, setIsUploading] = useState(false); // state to track upload status
  const [uploadProgress, setUploadProgress] = useState(0); // state to track upload progress
  const [error, setError] = useState<string | null>(null); // state to store any upload errors
  const [isDragging, setIsDragging] = useState(false); // state to track drag-and-drop status

  const router = useRouter(); 

  // max file size of 100 MB
  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  const handleFileChange = (selectedFile: File | null) => {
    setError(null);
    if (!selectedFile) {
      setFile(null);
      return;
    } // no file selected, make setfile to null

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(
        `File size exceeds 100 MB limit (Selected file: ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`
      );
      setFile(null);
      return;
    } // file size exceeded

    setFile(selectedFile);
    if (!title) {
      // Auto-populate title from filename
      const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf(".")) || selectedFile.name; // automatic title capture from filename if not given
      setTitle(nameWithoutExt); //set title to filename 
    }
  }; // handle file selection and validation

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); // prevent default behavior for drag-and-drop events 
    setIsDragging(false); // whn drag n drop is done, set dragging to false
    const droppedFile = e.dataTransfer.files?.[0]; // get first dropped file
    // Validate file type
    if (droppedFile && droppedFile.type.startsWith("video/")) {
      handleFileChange(droppedFile);// validate and handle the dropped file
    } else {
      setError("Please select a valid video file.");
    }
  }; // handle file drop event and validate the dropped file via (handleFileChange)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent default browser form submission behavior
    setError(null); // reset any previous error messages
    if (!file) {
      setError("Please choose a video file to upload.");
      return;
    }

    setIsUploading(true); // set uploading state to true
    setUploadProgress(0); // reset upload progress to 0

    try {
      // Step 1: Fetch upload signature params from server
      const sigRes = await axios.get("/api/video-upload/signature"); // (frontend --> backend) request to get signature params for direct upload to Cloudinary
      const { timestamp, signature, apiKey, cloudName, folder } = sigRes.data; //data from signature response

      // Step 2: Upload file directly to Cloudinary bypassing Vercel body limits
      const cloudinaryFormData = new FormData(); // new object to hold form data for Cloudinary upload
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("api_key", apiKey);
      cloudinaryFormData.append("timestamp", timestamp.toString());
      cloudinaryFormData.append("signature", signature);
      cloudinaryFormData.append("folder", folder);
      //append the file and signature params to the form data for Cloudinary upload

      const cldRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload` //cloudinary upload endpoint for video uploads
        ,cloudinaryFormData, // data to be sent in the request body
        {
          onUploadProgress: (progressEvent) => {
            // Calculate and update upload progress percentage
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        }
      ); // post the data to cloudinary and track upload progress

      const { public_id, duration, bytes } = cldRes.data; // id, duration, and size of the uploaded video returned from uploaded data to cloud

      // Step 3: Save video metadata to Prisma PostgreSQL database
      const saveRes = await axios.post("/api/video-upload", {
        publicId: public_id,
        title,
        description,
        originalSize: file.size.toString(),
        bytes,
        duration: duration || 0,
      }); // save the video metadata to the database via backend API

      if (saveRes.status === 200) {
        router.push("/home");
      } // back to home page after successful upload and save
    } catch (err: any) {
      console.error("Video upload failed:", err);
      const rawError =
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to upload video. Please try again.";
      setError(typeof rawError === "string" ? rawError : JSON.stringify(rawError));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3.5 bg-gradient-to-tr from-primary to-secondary rounded-2xl text-white shadow-lg shadow-primary/20">
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Upload Video Asset</h1>
          <p className="text-sm text-base-content/70">
            Direct Cloudinary high-speed encoding and streaming (up to 100 MB).
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error rounded-2xl mb-6 shadow-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Interactive Drag & Drop File Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`glass-card rounded-3xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : file
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"
          }`}
        >
          <input
            type="file"
            accept="video/*"
            id="file-upload-input"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
            disabled={isUploading}
          />

          <label htmlFor="file-upload-input" className="cursor-pointer space-y-4 block">
            {file ? (
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-3 border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <p className="font-bold text-base text-emerald-400">{file.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-base-content/60">
                  <span>Size: {formatBytes(file.size)}</span>
                  <span>•</span>
                  <span>Type: {file.type || "video/mp4"}</span>
                </div>
                <p className="text-xs text-primary font-semibold mt-3 underline">
                  Click to change file
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl mb-3">
                  <FileVideo className="w-10 h-10 animate-pulse" />
                </div>
                <p className="font-bold text-base">
                  Drag & drop your video here, or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-base-content/50 mt-1">
                  Supports MP4, MOV, AVI, WEBM (Max size 100 MB)
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Video Title & Description Metadata */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
          <div>
            <label className="label">
              <span className="label-text font-bold">Video Title *</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered w-full rounded-xl"
              placeholder="e.g., Product Launch Teaser"
              required
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-bold">Description</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea textarea-bordered w-full rounded-xl h-24"
              placeholder="Add details or tags for this video..."
            />
          </div>
        </div>

        {/* Upload Button & Real-time Progress Indicator */}
        <div className="space-y-3">
          {isUploading && (
            <div className="glass-card rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold text-primary">
                <span>Uploading directly to Cloudinary...</span>
                <span>{uploadProgress}%</span>
              </div>
              <progress
                className="progress progress-primary w-full h-3 rounded-full transition-all duration-300"
                value={uploadProgress}
                max="100"
              ></progress>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full rounded-2xl text-base shadow-xl shadow-primary/25 font-bold"
            disabled={isUploading || !file}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-md"></span>
                Uploading Video ({uploadProgress}%)...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Upload & Stream Video <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  ); // frontend UI for AI video upload, allowing users to select a video file, input title and description, and upload the video directly to Cloudinary with real-time progress feedback.
}

export default VideoUpload;
