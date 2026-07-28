"use client";

import React, { useState, useRef } from "react";
import { CldImage } from "next-cloudinary";
import { Type, Download, Image as ImageIcon, ShieldCheck } from "lucide-react";

const positions = [
  { id: "south_east", label: "Bottom Right" },
  { id: "south_west", label: "Bottom Left" },
  { id: "north_east", label: "Top Right" },
  { id: "north_west", label: "Top Left" },
  { id: "center", label: "Center Overlay" },
];

const colors = [
  { id: "rgb:ffffff", label: "White", hex: "#ffffff" },
  { id: "rgb:000000", label: "Black", hex: "#000000" },
  { id: "rgb:f59e0b", label: "Gold", hex: "#f59e0b" },
  { id: "rgb:ef4444", label: "Crimson Red", hex: "#ef4444" },
  { id: "rgb:3b82f6", label: "Royal Blue", hex: "#3b82f6" },
];

export default function WatermarkPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState("© 2026 My Brand");
  const [position, setPosition] = useState("south_east");
  const [color, setColor] = useState("rgb:ffffff");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(70);

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

    fetch(imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `watermarked_image.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("Download failed", err);
      });
  };

  const sanitizeText = (txt: string) => {
    return encodeURIComponent(txt.trim() || "Brand");
  };

  const watermarkTransformation = [
    `l_text:Arial_${fontSize}_bold:${sanitizeText(watermarkText)},co_${color},o_${opacity},g_${position},x_25,y_25`,
  ];

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-accent/10 rounded-xl text-accent">
          <Type className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Smart Watermark & Brand Overlay Studio</h1>
          <p className="text-sm opacity-70">
            Protect your creative assets with custom text watermarks, custom position alignment, opacity, and styling.
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
                <ImageIcon className="w-5 h-5 text-accent" />
                1. Upload Source Asset
              </h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input file-input-bordered file-input-accent w-full"
                disabled={isUploading}
              />
              {isUploading && (
                <div className="mt-3">
                  <progress className="progress progress-accent w-full"></progress>
                  <p className="text-xs text-center mt-1 text-accent">Uploading image...</p>
                </div>
              )}
            </div>
          </div>

          {uploadedImage && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body space-y-4">
                <h2 className="card-title text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  2. Watermark Controls
                </h2>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Watermark Text</span>
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => {
                      setWatermarkText(e.target.value);
                      setIsTransforming(true);
                    }}
                    className="input input-bordered w-full"
                    placeholder="Enter brand watermark text..."
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Position Alignment</span>
                  </label>
                  <select
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      setIsTransforming(true);
                    }}
                    className="select select-bordered w-full"
                  >
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Text Color</span>
                  </label>
                  <div className="flex gap-2">
                    {colors.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setColor(c.id);
                          setIsTransforming(true);
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          color === c.id ? "border-accent scale-110 shadow-md" : "border-base-300"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Font Size</span>
                    <span>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(Number(e.target.value));
                      setIsTransforming(true);
                    }}
                    className="range range-accent range-xs"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Opacity / Transparency</span>
                    <span>{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => {
                      setOpacity(Number(e.target.value));
                      setIsTransforming(true);
                    }}
                    className="range range-accent range-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Canvas */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl h-full flex flex-col justify-between">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Watermark Live Preview</h2>

              {!uploadedImage ? (
                <div className="border-2 border-dashed border-base-300 rounded-2xl h-80 flex flex-col items-center justify-center p-6 text-center text-base-content/50">
                  <Type className="w-16 h-16 mb-4 text-accent/40 animate-pulse" />
                  <p className="font-semibold text-lg">No image uploaded yet</p>
                  <p className="text-sm max-w-sm mt-1">
                    Upload an asset to add custom copyright text watermarks, logo overlays, and position controls.
                  </p>
                </div>
              ) : (
                <div className="relative flex justify-center items-center rounded-2xl overflow-hidden bg-base-300 min-h-[380px] p-4">
                  {isTransforming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100/70 z-20 backdrop-blur-sm">
                      <span className="loading loading-spinner loading-lg text-accent"></span>
                      <p className="text-sm font-semibold mt-2 text-accent">Applying watermark...</p>
                    </div>
                  )}

                  <CldImage
                    width={900}
                    height={675}
                    src={uploadedImage}
                    alt="Watermark Transformation"
                    crop="limit"
                    rawTransformations={watermarkTransformation}
                    ref={imageRef}
                    onLoad={() => setIsTransforming(false)}
                    className="max-h-[500px] w-auto object-contain rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            {uploadedImage && (
              <div className="card-actions p-6 pt-0 justify-end">
                <button onClick={handleDownload} className="btn btn-accent w-full sm:w-auto">
                  <Download className="w-5 h-5 mr-2" />
                  Download Watermarked Asset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
