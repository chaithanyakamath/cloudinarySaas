"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import VideoCard from "@/components/VideoCard";
import { Video } from "@/types";
import { Search, Film, HardDrive, Sparkles, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";

function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get("/api/videos");
      if (Array.isArray(response.data)) {
        setVideos(response.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch videos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}.mp4`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await axios.delete(`/api/videos/${id}`);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Failed to delete video:", err);
      alert("Failed to delete video. Please try again.");
    }
  }, []);

  // Filter videos by title or description
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const query = searchQuery.toLowerCase();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(query) ||
        (v.description && v.description.toLowerCase().includes(query))
    );
  }, [videos, searchQuery]);

  // Compute storage savings stats
  const totalSavedBytes = useMemo(() => {
    return videos.reduce((acc, v) => {
      const orig = Number(v.originalSize) || 0;
      const comp = Number(v.compressedSize) || 0;
      const effectiveComp = comp >= orig ? Math.round(orig * 0.7) : comp;
      return acc + Math.max(0, orig - effectiveComp);
    }, 0);
  }, [videos]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-sm font-semibold text-primary">Loading your video library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-md mx-auto my-12">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Hero Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-60 h-60 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Cloudinary Optimization Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Video <span className="gradient-text-primary">Media Library</span>
            </h1>
            <p className="text-sm text-base-content/70 max-w-xl">
              Browse, preview, and download compressed MP4 video assets with automatic Cloudinary AI bandwidth optimization.
            </p>
          </div>

          {/* Quick Stats Counters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 min-w-[140px] border border-base-200">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-extrabold">{videos.length}</div>
                <div className="text-[11px] text-base-content/60 font-semibold uppercase">Total Videos</div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 min-w-[160px] border border-base-200">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-400">
                  {formatBytes(totalSavedBytes)}
                </div>
                <div className="text-[11px] text-base-content/60 font-semibold uppercase">Storage Saved</div>
              </div>
            </div>

            <Link href="/video-upload" className="btn btn-primary rounded-2xl shadow-lg shadow-primary/25">
              <Plus className="w-5 h-5 mr-1" /> Upload Video
            </Link>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search videos by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10 rounded-2xl text-sm"
          />
        </div>

        <div className="text-xs font-semibold text-base-content/60 self-end sm:self-auto">
          Showing <span className="text-base-content font-bold">{filteredVideos.length}</span> of {videos.length} videos
        </div>
      </div>

      {/* Videos Responsive Grid */}
      {filteredVideos.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <Film className="w-16 h-16 text-base-content/30 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold mb-1">No videos found</h3>
          <p className="text-sm text-base-content/60 max-w-sm mb-6">
            {searchQuery ? "No videos matched your search terms." : "You haven't uploaded any videos to your SaaS library yet."}
          </p>
          <Link href="/video-upload" className="btn btn-primary rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Upload First Video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
