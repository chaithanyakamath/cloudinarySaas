"use client";

import React, { useState, useEffect, useRef } from "react";
import { getCldVideoUrl } from "next-cloudinary";
import axios from "axios";
import { Video as VideoIcon, Download, Film, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Video } from "@/types";

const studioModes = [
  {
    id: "shorts",
    label: "TikTok / Shorts / Reels (9:16 Portrait)",
    description: "AI subject tracking to auto-crop horizontal videos into mobile vertical video.",
    getConfig: (publicId: string) =>
      getCldVideoUrl({
        src: publicId,
        width: 720,
        height: 1280,
        crop: "fill",
        gravity: "auto",
      }),
  },
  {
    id: "square",
    label: "Instagram Square (1:1)",
    description: "Smart 1:1 square crop with AI gravity subject centering.",
    getConfig: (publicId: string) =>
      getCldVideoUrl({
        src: publicId,
        width: 1080,
        height: 1080,
        crop: "fill",
        gravity: "auto",
      }),
  },
  {
    id: "gif",
    label: "Animated GIF Converter",
    description: "Converts video into a high-quality looping animated GIF.",
    getConfig: (publicId: string) =>
      getCldVideoUrl({
        src: publicId,
        width: 480,
        height: 270,
        rawTransformations: ["f_gif", "fl_animated", "e_loop"],
      }),
    isGif: true,
  },
  {
    id: "highlight",
    label: "Smart Video Highlights Trailer",
    description: "Generates a 10-second summary teaser from key video scenes.",
    getConfig: (publicId: string) =>
      getCldVideoUrl({
        src: publicId,
        width: 854,
        height: 480,
        rawTransformations: ["e_preview:duration_10:max_seg_5:min_seg_dur_1"],
      }),
  },
];

export default function VideoStudioPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedMode, setSelectedMode] = useState("shorts");
  const [loading, setLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/videos");
      if (Array.isArray(res.data) && res.data.length > 0) {
        setVideos(res.data);
        setSelectedVideo(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch videos", err);
    } finally {
      setLoading(false);
    }
  };

  const activeModeObj = studioModes.find((m) => m.id === selectedMode) || studioModes[0];
  const transformedUrl = selectedVideo ? activeModeObj.getConfig(selectedVideo.publicId) : "";

  // Reset loading & error states when selection changes or retry is clicked
  useEffect(() => {
    if (transformedUrl) {
      setIsVideoLoading(true);
      setVideoError(false);
    }
  }, [selectedVideo, selectedMode, retryKey]);

  const handleRetry = () => {
    setVideoError(false);
    setIsVideoLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  const handleDownload = () => {
    if (!transformedUrl || !selectedVideo) return;

    const extension = activeModeObj.isGif ? "gif" : "mp4";
    const link = document.createElement("a");
    link.href = transformedUrl;
    link.setAttribute("download", `${selectedVideo.title}_${selectedMode}.${extension}`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Film className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Smart Video Studio & Shorts/Reels Converter</h1>
          <p className="text-sm opacity-70">
            Convert landscape videos to 9:16 Shorts/Reels with AI subject tracking, create animated GIFs, and trailers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Controls */}
        <div className="space-y-6">
          {/* Select Video */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-primary" />
                1. Select Target Video
              </h2>

              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-4 text-sm text-base-content/60">
                  No videos uploaded yet. Go to <span className="font-bold text-primary">Video Upload</span> to upload a video first.
                </div>
              ) : (
                <select
                  value={selectedVideo?.id || ""}
                  onChange={(e) => {
                    const found = videos.find((v) => v.id === e.target.value);
                    if (found) {
                      setSelectedVideo(found);
                    }
                  }}
                  className="select select-bordered w-full"
                >
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Select Studio Mode */}
          {selectedVideo && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  2. Choose Transformation Mode
                </h2>

                <div className="space-y-3">
                  {studioModes.map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => {
                        setSelectedMode(mode.id);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedMode === mode.id
                          ? "border-primary bg-primary/10 text-primary shadow-md"
                          : "border-base-300 hover:bg-base-200 text-base-content"
                      }`}
                    >
                      <div className="font-bold text-sm">{mode.label}</div>
                      <div className="text-xs opacity-75 mt-0.5">{mode.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl h-full flex flex-col justify-between">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Studio Video Canvas</h2>

              {!selectedVideo ? (
                <div className="border-2 border-dashed border-base-300 rounded-2xl h-80 flex flex-col items-center justify-center p-6 text-center text-base-content/50">
                  <Film className="w-16 h-16 mb-4 text-primary/40 animate-pulse" />
                  <p className="font-semibold text-lg">No video selected</p>
                  <p className="text-sm max-w-sm mt-1">
                    Upload a video or select an existing video from your library to convert it into 9:16 Shorts or looping GIFs.
                  </p>
                </div>
              ) : (
                <div className="relative flex justify-center items-center rounded-2xl overflow-hidden bg-base-300 min-h-[380px] p-4">
                  {/* Loading Overlay */}
                  {isVideoLoading && !videoError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-100/70 z-20 backdrop-blur-sm">
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                      <p className="text-sm font-semibold text-primary">Processing Cloudinary transformation...</p>
                      <p className="text-xs text-base-content/60 mt-1">Preparing AI gravity crop & stream</p>
                    </div>
                  )}

                  {/* Error / Retry Overlay */}
                  {videoError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-base-100/90 z-30">
                      <p className="text-error font-semibold mb-1">Transformation processing on Cloudinary...</p>
                      <p className="text-xs text-base-content/60 mb-4 max-w-xs">
                        Cloudinary is generating the AI crop in the background. Click retry to load the preview.
                      </p>
                      <button
                        onClick={handleRetry}
                        className="btn btn-sm btn-primary"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" /> Retry Preview
                      </button>
                    </div>
                  )}

                  {activeModeObj.isGif ? (
                    <img
                      key={`${transformedUrl}-${retryKey}`}
                      src={`${transformedUrl}${transformedUrl.includes('?') ? '&' : '?'}t=${retryKey}`}
                      alt="Animated GIF"
                      onLoad={() => {
                        setIsVideoLoading(false);
                        setVideoError(false);
                      }}
                      onError={() => {
                        setIsVideoLoading(false);
                        setVideoError(true);
                      }}
                      className="max-h-[480px] w-auto object-contain rounded-lg shadow-lg"
                    />
                  ) : (
                    <video
                      key={`${transformedUrl}-${retryKey}`}
                      ref={videoRef}
                      src={`${transformedUrl}${transformedUrl.includes('?') ? '&' : '?'}t=${retryKey}`}
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      onLoadedData={() => {
                        setIsVideoLoading(false);
                        setVideoError(false);
                      }}
                      onCanPlay={() => {
                        setIsVideoLoading(false);
                        setVideoError(false);
                      }}
                      onError={() => {
                        setIsVideoLoading(false);
                        setVideoError(true);
                      }}
                      className="max-h-[480px] w-auto object-contain rounded-lg shadow-lg"
                    />
                  )}
                </div>
              )}
            </div>

            {selectedVideo && (
              <div className="card-actions p-6 pt-0 justify-end">
                <button onClick={handleDownload} className="btn btn-primary w-full sm:w-auto">
                  <Download className="w-5 h-5 mr-2" />
                  Download Transformed {activeModeObj.isGif ? "GIF" : "Video"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
