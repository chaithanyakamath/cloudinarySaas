"use client";

import React, { useState, useRef } from "react";
import { CldImage } from "next-cloudinary";
import { Scissors, Download, Sparkles, Image as ImageIcon, Check } from "lucide-react";

const backdropOptions = [
  { id: "transparent", label: "Transparent (PNG)", bgClass: "bg-checkered", transformation: ["e_background_removal"], format: "png" },
  { id: "blur", label: "Blurred Backdrop", bgClass: "bg-slate-800", transformation: ["e_blur:1200"] },
  { id: "white", label: "Clean White", bgClass: "bg-white text-black", transformation: ["e_background_removal", "b_white"] },
  { id: "slate", label: "Slate Dark", bgClass: "bg-slate-900", transformation: ["e_background_removal", "b_rgb:0f172a"] },
  { id: "indigo", label: "Neon Indigo", bgClass: "bg-indigo-600", transformation: ["e_background_removal", "b_rgb:4f46e5"] },
  { id: "emerald", label: "Emerald Green", bgClass: "bg-emerald-600", transformation: ["e_background_removal", "b_rgb:059669"] },
  { id: "sunset", label: "Sunset Warmth", bgClass: "bg-amber-600", transformation: ["e_background_removal", "b_rgb:d97706"] },
  { id: "vintage", label: "Vintage Sepia", bgClass: "bg-yellow-950", transformation: ["e_sepia"] },
];

export default function AIBackgroundPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedBackdrop, setSelectedBackdrop] = useState("transparent");
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image.");
      }

      const data = await response.json();
      setUploadedImage(data.publicId);
      setIsTransforming(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!imageRef.current) return;

    const activeOpt = backdropOptions.find((opt) => opt.id === selectedBackdrop);
    const extension = activeOpt?.format === "png" ? "png" : "jpg";

    fetch(imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `bg_removed_${selectedBackdrop}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Download failed", err);
      });
  };

  const activeOption = backdropOptions.find((opt) => opt.id === selectedBackdrop) || backdropOptions[0];

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Scissors className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Background Removal & Backdrop Studio</h1>
          <p className="text-sm opacity-70">
            Automatically isolate subjects and swap backdrops with studio colors, blurs, or transparent PNGs.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Options */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                1. Upload Source Image
              </h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input file-input-bordered file-input-primary w-full"
                disabled={isUploading}
              />
              {isUploading && (
                <div className="mt-3">
                  <progress className="progress progress-primary w-full"></progress>
                  <p className="text-xs text-center mt-1 text-primary">Uploading image...</p>
                </div>
              )}
            </div>
          </div>

          {uploadedImage && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  2. Choose Backdrop Style
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {backdropOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedBackdrop(opt.id);
                        setIsTransforming(true);
                      }}
                      className={`p-3 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        selectedBackdrop === opt.id
                          ? "border-primary bg-primary/10 text-primary shadow-md"
                          : "border-base-300 hover:bg-base-200"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedBackdrop === opt.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Preview Canvas */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl h-full flex flex-col justify-between">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Studio Live Preview</h2>

              {!uploadedImage ? (
                <div className="border-2 border-dashed border-base-300 rounded-2xl h-80 flex flex-col items-center justify-center p-6 text-center text-base-content/50">
                  <Scissors className="w-16 h-16 mb-4 text-primary/40 animate-pulse" />
                  <p className="font-semibold text-lg">No image uploaded yet</p>
                  <p className="text-sm max-w-sm mt-1">
                    Upload any photo on the left to remove background and preview studio backdrops in real-time.
                  </p>
                </div>
              ) : (
                <div className="relative flex justify-center items-center rounded-2xl overflow-hidden bg-base-300 min-h-[350px] p-4">
                  {isTransforming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100/70 z-20 backdrop-blur-sm">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                      <p className="text-sm font-semibold mt-2 text-primary">Applying AI transformation...</p>
                    </div>
                  )}

                  <CldImage
                    width={800}
                    height={600}
                    src={uploadedImage}
                    alt="AI Background Transformation"
                    crop="limit"
                    rawTransformations={activeOption.transformation}
                    format={activeOption.format || "jpg"}
                    ref={imageRef}
                    onLoad={() => setIsTransforming(false)}
                    className="max-h-[480px] w-auto object-contain rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            {uploadedImage && (
              <div className="card-actions p-6 pt-0 justify-end">
                <button onClick={handleDownload} className="btn btn-primary w-full sm:w-auto">
                  <Download className="w-5 h-5 mr-2" />
                  Download Transformed Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
