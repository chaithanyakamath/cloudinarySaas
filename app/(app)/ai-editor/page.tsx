"use client";

import React, { useState, useRef } from "react"; // react hooks for state management
import { CldImage } from "next-cloudinary"; // cloudinary hook for optimized image rendering
import { Wand2, Download, Image as ImageIcon, Sliders, Check } from "lucide-react"; // lucide-react icons for UI elements

const filterPresets = [
  { id: "original", label: "Original", transformations: [] },
  { id: "enhance", label: "AI Auto-Improve", transformations: ["e_improve"] },
  { id: "cartoon", label: "Cartoonify", transformations: ["e_cartoonify:20:50"] },
  { id: "oil_paint", label: "Oil Painting", transformations: ["e_oil_paint:40"] },
  { id: "pixelate", label: "Pixel Art", transformations: ["e_pixelate:12"] },
  { id: "sepia", label: "Vintage Sepia", transformations: ["e_sepia:70"] },
  { id: "noir", label: "Black & White Noir", transformations: ["e_grayscale"] },
  { id: "vignette", label: "Vignette Focus", transformations: ["e_vignette:50"] },
  { id: "vectorize", label: "Vector Art", transformations: ["e_vectorize:colors:5"] },
]; // array of filter presets with their corresponding Cloudinary transformations

export default function AIEditorPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // state to hold the uploaded image's public ID
  const [selectedFilter, setSelectedFilter] = useState("enhance"); // state to hold the currently selected filter preset
  const [isUploading, setIsUploading] = useState(false); // state to indicate if an image is currently being uploaded
  const [isTransforming, setIsTransforming] = useState(false); // state to indicate if the image is currently being transformed with the selected filter
  const [error, setError] = useState<string | null>(null); // state to hold any error messages related to file upload or transformation

  const imageRef = useRef<HTMLImageElement>(null); // ref to the img element to access its properties for download

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
  }; // handleFileUpload function handles the file input change event, uploads the selected image to the server, and updates the state accordingly.

  const handleDownload = () => {
    if (!imageRef.current) return;

    fetch(imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ai_edited_${selectedFilter}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Download failed", err);
      });
  }; // same bunch of code to handle download of the transformed image, creating a temporary link to trigger the download

  const activeFilterObj = filterPresets.find((f) => f.id === selectedFilter) || filterPresets[0]; // find the currently selected filter preset object, default to the first preset if not found

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
          <Wand2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Photo Editor & Creative Filter Studio</h1>
          <p className="text-sm opacity-70">
            Apply AI image enhancement, oil painting, cartoonify, vectorization, and artistic filters.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Controls */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-secondary" />
                1. Upload Photo
              </h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input file-input-bordered file-input-secondary w-full"
                disabled={isUploading}
              />
              {isUploading && (
                <div className="mt-3">
                  <progress className="progress progress-secondary w-full"></progress>
                  <p className="text-xs text-center mt-1 text-secondary">Uploading image...</p>
                </div>
              )}
            </div>
          </div>

          {uploadedImage && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg flex items-center gap-2 mb-2">
                  <Sliders className="w-5 h-5 text-secondary" />
                  2. Select Filter Effect
                </h2>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                  {filterPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedFilter(preset.id);
                        setIsTransforming(true);
                      }}
                      className={`p-3 rounded-lg border text-left text-sm font-semibold flex items-center justify-between transition-all ${
                        selectedFilter === preset.id
                          ? "border-secondary bg-secondary/10 text-secondary shadow-md"
                          : "border-base-300 hover:bg-base-200"
                      }`}
                    >
                      <span>{preset.label}</span>
                      {selectedFilter === preset.id && <Check className="w-4 h-4 text-secondary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Canvas */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl h-full flex flex-col justify-between">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Live Transformation Canvas</h2>

              {!uploadedImage ? (
                <div className="border-2 border-dashed border-base-300 rounded-2xl h-80 flex flex-col items-center justify-center p-6 text-center text-base-content/50">
                  <Wand2 className="w-16 h-16 mb-4 text-secondary/40 animate-pulse" />
                  <p className="font-semibold text-lg">No image uploaded yet</p>
                  <p className="text-sm max-w-sm mt-1">
                    Upload a photo to transform it with AI filters, artistic oil paint, cartoonify, and vector effects.
                  </p>
                </div>
              ) : (
                <div className="relative flex justify-center items-center rounded-2xl overflow-hidden bg-base-300 min-h-[380px] p-4">
                  {isTransforming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100/70 z-20 backdrop-blur-sm">
                      <span className="loading loading-spinner loading-lg text-secondary"></span>
                      <p className="text-sm font-semibold mt-2 text-secondary">Applying AI filter...</p>
                    </div>
                  )}

                  <CldImage
                    width={900}
                    height={675}
                    src={uploadedImage}
                    alt="AI Filter Transformation"
                    crop="limit"
                    rawTransformations={activeFilterObj.transformations}
                    ref={imageRef}
                    onLoad={() => setIsTransforming(false)}
                    className="max-h-[500px] w-auto object-contain rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            {uploadedImage && (
              <div className="card-actions p-6 pt-0 justify-end">
                <button onClick={handleDownload} className="btn btn-secondary w-full sm:w-auto">
                  <Download className="w-5 h-5 mr-2" />
                  Download Transformed Photo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ); // frontend UI for AI photo editor, allowing users to upload an image, select from various AI filter presets, view a live transformation preview, and download the edited image.
}
