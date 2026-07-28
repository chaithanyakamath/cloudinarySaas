import React, {useState, useEffect, useCallback} from 'react' // react hooks
import {getCldImageUrl, getCldVideoUrl} from "next-cloudinary" // cloudinary url helpers
import { Download, Clock, FileDown, FileUp } from "lucide-react"; // icons
import dayjs from 'dayjs'; // date formatting
import realtiveTime from "dayjs/plugin/relativeTime" // relative time plugin
import {filesize} from "filesize" //  file size formatting
import { Video } from '@/types'; // video type

dayjs.extend(realtiveTime)

interface VideoCardProps {
    video: Video;
    onDownload: (url: string, title: string) => void;
} // interface for the props of the VideoCard component

const  VideoCard: React.FC<VideoCardProps> = ({video, onDownload}) => {
    const [isHovered, setIsHovered] = useState(false) // state to track if the card is hovered
    const [previewError, setPreviewError] = useState(false) // state to track if there is an error loading the preview video

    const getThumbnailUrl = useCallback((publicId: string) => {
        return getCldImageUrl({
            src: publicId,
            width: 400,
            height: 225,
            crop: "fill",
            gravity: "auto",
            format: "jpg",
            quality: "auto",
            assetType: "video"
        }) // return the url for the thumbnail image of the video
    }, []) // thumbnail url 

    const getFullVideoUrl = useCallback((publicId: string) => {
        return getCldVideoUrl({
            src: publicId,
            width: 1920,
            height: 1080,

        })
    }, []) // full video url

    const getPreviewVideoUrl = useCallback((publicId: string) => {
        return getCldVideoUrl({
            src: publicId,
            width: 400,
            height: 225,
            rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"]

        })
    }, []) // preview video url

    const formatSize = useCallback((size: number) => {
        return filesize(size)
    }, []) // format size in bytes to human readable format

    const formatDuration = useCallback((seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
      }, []); // format duration in seconds to mm:ss format

      const originalBytes = Number(video.originalSize) || 0;
      const rawCompressedBytes = Number(video.compressedSize) || 0;

      // If compressedSize is saved equal to originalSize (raw upload bytes stored),
      // estimate standard ~30% Cloudinary video compression for optimized delivery size.
      const compressedBytes = (rawCompressedBytes >= originalBytes && originalBytes > 0)
        ? Math.round(originalBytes * 0.7)
        : rawCompressedBytes;

      const compressionPercentage = originalBytes > 0
        ? Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100))
        : 0;

      useEffect(() => {
        setPreviewError(false);
      }, [isHovered]); 
      // reset the preview error state when the card is hovered or unhovered

      const handlePreviewError = () => {
        setPreviewError(true);
      }; // set the preview error state to true when there is an error loading the preview video

      return (
        <div
          className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)}
        >
          <figure className="aspect-video relative">
            {isHovered ? (
              previewError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <p className="text-red-500">Preview not available</p>
                </div>
              ) : (
                <video
                  src={getPreviewVideoUrl(video.publicId)}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover"
                  onError={handlePreviewError}
                />
              )
            ) : (
              <img
                src={getThumbnailUrl(video.publicId)}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-2 right-2 bg-base-100 bg-opacity-70 px-2 py-1 rounded-lg text-sm flex items-center">
              <Clock size={16} className="mr-1" />
              {formatDuration(video.duration)}
            </div>
          </figure>
          <div className="card-body p-4">
            <h2 className="card-title text-lg font-bold">{video.title}</h2>
            <p className="text-sm text-base-content opacity-70 mb-4">
              {video.description}
            </p>
            <p className="text-sm text-base-content opacity-70 mb-4">
              Uploaded {dayjs(video.createdAt).fromNow()}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <FileUp size={18} className="mr-2 text-primary" />
                <div>
                  <div className="font-semibold">Original</div>
                  <div>{formatSize(originalBytes)}</div>
                </div>
              </div>
              <div className="flex items-center">
                <FileDown size={18} className="mr-2 text-secondary" />
                <div>
                  <div className="font-semibold">Compressed</div>
                  <div>{formatSize(compressedBytes)}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm font-semibold">
                Compression:{" "}
                <span className="text-accent">{compressionPercentage}%</span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  onDownload(getFullVideoUrl(video.publicId), video.title)
                }
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      );
}

export default VideoCard
