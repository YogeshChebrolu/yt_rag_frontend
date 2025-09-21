import { ReactNode, createContext, useContext, useState, useEffect } from "react";

declare const chrome: any;

interface Message {
  "id": string | null,
  "role": "USER" | "ASSISTANT"
  "video_id": string | null,
  "content": string,
}

type VideoStatus = 'IDLE' | 'PROCESSING' | "READY" | "ERROR"

interface VideoContextProps {
  currentVideoId: (string | null);
  setCurrentVideoId: (id: string | null) => void;
  videoStatus: VideoStatus;
  chatHistory: Message[];
}

const VideoContext = createContext<VideoContextProps | null>(null)

interface VideoContextProviderProps {
  children: ReactNode
}

export const VideoContextProvider = ({children}: VideoContextProviderProps) => {
  const [ currentVideoId, setCurrentVideoId ] = useState<string | null>(null);
  const [ videoStatus, _setVideoStatus] = useState<VideoStatus>('IDLE')
  const [ chatHistory, _setChatHistory ] = useState<Message[]>([]);
  const [ error, _setError ] = useState<string | null>(null);

  useEffect(()=>{
    const handler = (message: any) => {
      if (message.type === "VIDEO_ID_UPDATE") {
        setCurrentVideoId(message.video_id);
      }
    };

    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, []);


  // const handleInitializeVideo = useCallback(async (videoId: string) => {
  //   setCurrentVideoId(videoId)
  //   setChatHistory([]);
  //   setError(null)

  //   try {
  //     const statatusResult = await checkVideoStatus(videoId);
  //     if (statatusResult.isProcessed) {
  //       setVideoStatus("READY")

  //       const history = await getChatHistory(videoId);
  //       setChatHistory(history);
  //     }
  //   } catch (error) {
  //     setError("Failed to check video status.")
  //     setVideoStatus("ERROR")
  //   }
  // }, []);

  // const handleProcessCurrentVideo = useCallback(async () => {
  //   if (!currentVideoId) return;

  //   setVideoStatus("PROCESSING")
  //   setError(null);

  //   try {
  //     await processCurrentVideo(currentVideoId);
  //     setVideoStatus("READY")
  //   } catch (error) {
  //     setError("Failed to process the video")
  //     setVideoStatus("ERROR")
  //   }
  // }, [currentVideoId]);


  // const handleChatMessage = useCallback((messageText: string) => {
  //   if (!currentVideoId) return;
    
  //   const userMessage: Message = { role:"USER", content:messageText };
  //   setChatHistory(prev => [...prev, userMessage])

  //   try {
  //     const assistantresponse = await sendChatMessage(currentVideoId, messageText)
  //     const assistantMessage: Message = {role:"ASSISTANT", content:assistantresponse.content};
      
  //     setChatHistory(prev => [...prev, assistantMessage]);
  //   } catch (error) {
  //     setError("Failed to get assistant response")
  //   }
  // }, [currentVideoId]);

  const value = { 
    currentVideoId,
    setCurrentVideoId,
    videoStatus,
    chatHistory,
    error,
    // handleProcessCurrentVideo,
    // handleInitializeVideo,
    // handleChatMessage,
  };

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
}

export function useVideoContext(){
  const context = useContext(VideoContext)
  if (!context) {
    throw new Error("useVideoContext must be used within the videoContextProvider")
  }
  return context
} 