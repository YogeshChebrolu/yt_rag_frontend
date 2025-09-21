import { checkVideoStatus, processVideo } from "@/api/videoProcess"
import { useVideoContext } from "@/context/VideoContext"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"

type status = "notProcessed" | "processing" | "processed" | undefined


// This should display a card with the status of video at top of chat messages 

export async function VideoStatus(){
  const { currentVideoId } = useVideoContext()
  const [videoStatus, setVideoStatus] = useState<status>()
  const [ error, setError ] = useState<string>("")
  useEffect(()=>{
    const result = await checkVideoStatus(currentVideoId!)
    if (result.status === "not processed"){
      setVideoStatus("notProcessed")
      const processResult = await handleVideoProcessing(currentVideoId!)
    }
    else{
      setVideoStatus("processed")
    }
  }, []);
  const handleVideoProcessing = async (videoid: string) => {
    setVideoStatus("processing")
    const processResponse = await processVideo(videoid )
    if (processResponse.status = "processed") {
      setVideoStatus("processed")
    }
  }
  return (
    <div>
      video: {currentVideoId}

      <Button>
        process
      </Button>
    </div>
  );
}