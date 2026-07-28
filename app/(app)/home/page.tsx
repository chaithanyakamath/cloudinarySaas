"use client"
import React, {useState, useEffect, useCallback} from 'react' // react imports
import axios from 'axios' // axios for making api requests
import VideoCard from '@/components/VideoCard' // video card component
import { Video } from '@/types' // video type

function Home() {
    const [videos, setVideos] = useState<Video[]>([]) // state to store the list of videos
    const [loading, setLoading] = useState(true) // state to track if the videos are being loaded
    const [error, setError] = useState<string | null>(null) // state to track if there is an error fetching the videos

    const fetchVideos = useCallback(async () => {
        try {
            const response = await axios.get("/api/videos") // fetch the list of videos from the api
            if(Array.isArray(response.data)) {
                setVideos(response.data)
            } else {
                throw new Error(" Unexpected response format");

            }
        } catch (error) {
            console.log(error);
            setError("Failed to fetch videos")

        } finally {
            setLoading(false)
        }
    }, []) // fetch the list of videos from the api and set the state accordingly

    useEffect(() => {
        fetchVideos()
    }, [fetchVideos]) // fetch the list of videos when the component mounts

    const handleDownload = useCallback((url: string, title: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${title}.mp4`);
        link.setAttribute("target", "_blank");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []) // handle the download of the video when the download button is clicked

    if(loading){
        return <div>Loading...</div>
    } // if the videos are being loaded, show a loading message

    if(error){
        return <div>{error}</div>
    } // if there is an error fetching the videos, show an error message

    return (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Videos</h1>
          {videos.length === 0 ? (
            <div className="text-center text-lg text-gray-500">
              No videos available
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {
                videos.map((video) => (
                    <VideoCard
                        key={video.id}
                        video={video}
                        onDownload={handleDownload}
                    />
                ))
              }
            </div>
          )}
        </div>
      );
}

export default Home
