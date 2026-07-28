import React, { useState, useEffect, useCallback } from "react";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import { Download, Clock, FileDown, FileUp, Play, Sparkles, Trash2, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { filesize } from "filesize";
import { Video } from "@/types";

dayjs.extend(relativeTime);

interface VideoCardProps {
  video: Video;
  onDownload: (url: string, title: string) => void;
  onDelete?: (id: string) => Promise<void>;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDownload, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getThumbnailUrl = useCallback((publicId: string) => {
    return getCldImageUrl({
      src: publicId,
      width: 450,
      height: 250,
      crop: "fill",
      gravity: "auto",
      format: "jpg",
      quality: "auto",
      assetType: "video",
    });
  }, []);

  const getFullVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 1920,
      height: 1080,
    });
  }, []);

  const getPreviewVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 450,
      height: 250,
      rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"],
    });
  }, []);

  const formatSize = useCallback((size: number) => {
    return filesize(size);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const originalBytes = Number(video.originalSize) || 0;
  const rawCompressedBytes = Number(video.compressedSize) || 0;

  const compressedBytes =
    rawCompressedBytes >= originalBytes && originalBytes > 0
      ? Math.round(originalBytes * 0.7)
      : rawCompressedBytes;

  const compressionPercentage =
    originalBytes > 0
      ? Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100))
      : 0;

  useEffect(() => {
    setPreviewError(false);
  }, [isHovered]);

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(video.id);
    } catch (err) {
      console.error("Failed to delete video:", err);
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  return (
    <div
      className="card glass-card-hover rounded-2xl overflow-hidden shadow-xl group border border-base-200 flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsConfirmingDelete(false);
      }}
    >
      <div>
        {/* Video Thumbnail / Preview Container */}
        <figure className="aspect-video relative bg-slate-900 overflow-hidden">
          {isHovered ? (
            previewError ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 p-4 text-center">
                <p className="text-xs text-error font-medium">Preview not available</p>
              </div>
            ) : (
              <video
                src={getPreviewVideoUrl(video.publicId)}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover transition-transform duration-500 scale-105"
                onError={() => setPreviewError(true)}
              />
            )
          ) : (
            <img
              src={getThumbnailUrl(video.publicId)}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}

          {/* Hover Play Indicator */}
          {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/80 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/40">
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              </div>
            </div>
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center text-white border border-white/10">
            <Clock size={13} className="mr-1.5 text-primary" />
            {formatDuration(video.duration)}
          </div>
        </figure>

        {/* Card Details */}
        <div className="card-body p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="card-title text-base font-bold line-clamp-1 group-hover:text-primary transition-colors">
              {video.title}
            </h2>
          </div>

          <p className="text-xs text-base-content/70 line-clamp-2 min-h-[32px]">
            {video.description || "No description provided."}
          </p>

          <p className="text-[11px] text-base-content/50 font-medium">
            Uploaded {dayjs(video.createdAt).fromNow()}
          </p>

          {/* File Size Comparison Stats */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-base-200/50 rounded-xl text-xs border border-base-300">
            <div className="flex items-center">
              <FileUp size={16} className="mr-2 text-primary shrink-0" />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-base-content/50">Original</div>
                <div className="font-semibold text-xs">{formatSize(originalBytes)}</div>
              </div>
            </div>
            <div className="flex items-center">
              <FileDown size={16} className="mr-2 text-secondary shrink-0" />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-base-content/50">Compressed</div>
                <div className="font-semibold text-xs">{formatSize(compressedBytes)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-5 pt-0">
        <div className="flex items-center justify-between pt-3 border-t border-base-200">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">
              {compressionPercentage}% Saved
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="btn btn-error btn-xs rounded-lg text-white font-bold"
                  >
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={() => setIsConfirmingDelete(false)}
                    className="btn btn-ghost btn-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-ghost btn-sm text-error/80 hover:text-error hover:bg-error/10 rounded-xl p-2"
                  onClick={() => setIsConfirmingDelete(true)}
                  title="Delete Video"
                >
                  <Trash2 size={16} />
                </button>
              )
            )}

            <button
              className="btn btn-primary btn-sm rounded-xl font-semibold shadow-md shadow-primary/20 hover:scale-105 transition-transform"
              onClick={() => onDownload(getFullVideoUrl(video.publicId), video.title)}
              title="Download Video"
            >
              <Download size={14} className="mr-1" /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
