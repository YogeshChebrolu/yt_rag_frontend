import { ReactNode, createContext, useContext, useState, useEffect, useCallback } from "react";
import { checkVideoStatus, processVideo } from "@/api/videoProcess";
import { sendChatMessage, getChatHistory, ChatRequest, HistoryRequest } from "@/api/chat";
import { useSession } from "./AuthContext";

declare const chrome: any;

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: Date;
  video_id?: string;
}

type VideoStatus = 'IDLE' | 'NOT_PROCESSED' | 'PROCESSING' | "READY" | "ERROR"

interface VideoContextProps {
  currentVideoId: (string | null);
  setCurrentVideoId: (id: string | null) => void;
  videoStatus: VideoStatus;
  setVideoStatus: (status: VideoStatus) => void;
  chatHistory: Message[];
  setChatHistory: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleInitializeVideo: (videoId: string) => Promise<void>;
  handleProcessCurrentVideo: () => Promise<void>;
  handleChatMessage: (messageText: string) => Promise<void>;
}

const VideoContext = createContext<VideoContextProps | null>(null)

interface VideoContextProviderProps {
  children: ReactNode
}

export const VideoContextProvider = ({ children }: VideoContextProviderProps) => {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('IDLE')
  const [chatHistory, setChatHistoryState] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSession();

  // Wrapper function to handle both direct array and callback patterns
  const setChatHistory = useCallback((messages: Message[] | ((prev: Message[]) => Message[])) => {
    if (typeof messages === 'function') {
      setChatHistoryState(messages);
    } else {
      setChatHistoryState(messages);
    }
  }, []);

  useEffect(() => {
    const handler = (message: any) => {
      try {
        if (message.type === "VIDEO_ID_UPDATE") {
          console.log("VideoContext received video ID update:", message.video_id);
          setCurrentVideoId(message.video_id);
          // Reset error state when video changes
          setError(null);
        }
      } catch (error) {
        console.error("Error handling Chrome extension message:", error);
        setError("Failed to handle video ID update");
      }
    };

    // Add error handling for Chrome extension API calls
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(handler);
        console.log("Chrome extension message listener added");
      } else {
        console.warn("Chrome extension API not available");
        setError("Chrome extension API not available");
      }
    } catch (error) {
      console.error("Failed to add Chrome extension message listener:", error);
      setError("Failed to initialize Chrome extension communication");
    }

    return () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
          chrome.runtime.onMessage.removeListener(handler);
          console.log("Chrome extension message listener removed");
        }
      } catch (error) {
        console.error("Error removing Chrome extension message listener:", error);
      }
    };
  }, []);


  const handleInitializeVideo = useCallback(async (videoId: string) => {
    setCurrentVideoId(videoId);
    setChatHistory([]);
    setError(null);
    setVideoStatus('IDLE');

    try {
      const statusResult = await checkVideoStatus(videoId);
      if (statusResult?.isProcessed) {
        setVideoStatus("READY");

        const historyRequest: HistoryRequest = { video_id: videoId };
        const history = await getChatHistory(historyRequest);
        if (Array.isArray(history)) {
          setChatHistory(history);
        }
      } else {
        setVideoStatus("NOT_PROCESSED");
      }
    } catch (error) {
      console.error("Failed to initialize video:", error);
      setError("Failed to check video status.");
      setVideoStatus("ERROR");
    }
  }, []);

  const handleProcessCurrentVideo = useCallback(async () => {
    if (!currentVideoId) {
      setError("No video selected for processing");
      return;
    }

    setVideoStatus("PROCESSING");
    setError(null);

    try {
      await processVideo(currentVideoId);
      setVideoStatus("READY");
    } catch (error) {
      console.error("Failed to process video:", error);
      setError("Failed to process the video");
      setVideoStatus("ERROR");
    }
  }, [currentVideoId]);

  const handleChatMessage = useCallback(async (messageText: string) => {
    if (!currentVideoId) {
      setError("No video selected for chat");
      return;
    }

    if (!session?.user?.id) {
      setError("User not authenticated");
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "USER",
      content: messageText,
      timestamp: new Date(),
      video_id: currentVideoId
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const chatRequest: ChatRequest = {
        video_id: currentVideoId,
        query: messageText,
        user_id: session.user.id
      };

      const assistantResponse = await sendChatMessage(chatRequest);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "ASSISTANT",
        content: assistantResponse,
        timestamp: new Date(),
        video_id: currentVideoId
      };

      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send chat message:", error);
      setError("Failed to get assistant response");
    }
  }, [currentVideoId, session]);

  const value = {
    currentVideoId,
    setCurrentVideoId,
    videoStatus,
    setVideoStatus,
    chatHistory,
    setChatHistory,
    error,
    setError,
    handleProcessCurrentVideo,
    handleInitializeVideo,
    handleChatMessage,
  };

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
}

export function useVideoContext() {
  const context = useContext(VideoContext)
  if (!context) {
    throw new Error("useVideoContext must be used within the videoContextProvider")
  }
  return context
} 