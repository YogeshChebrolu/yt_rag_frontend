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
    let port: any = null;

    const initializeChromeConnection = () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          // Connect to background script
          port = chrome.runtime.connect({ name: "sidepanel" });
          console.log("Connected to background script");

          // Listen for messages from background script
          port.onMessage.addListener((message: any) => {
            try {
              if (message.type === "VIDEO_ID_UPDATE") {
                console.log("VideoContext received video ID update:", message.video_id);
                setCurrentVideoId(message.video_id);
                setError(null);
              }
            } catch (error) {
              console.error("Error handling background message:", error);
              setError("Failed to handle video ID update");
            }
          });

          port.onDisconnect.addListener(() => {
            console.log("Disconnected from background script");
          });

          // Also check chrome storage for current video ID
          chrome.storage.local.get(['currentVideoId'], (result: any) => {
            if (chrome.runtime.lastError) {
              console.error("Failed to get stored video ID:", chrome.runtime.lastError.message);
            } else if (result.currentVideoId) {
              console.log("Retrieved stored video ID:", result.currentVideoId);
              setCurrentVideoId(result.currentVideoId);
              setError(null);
            }
          });

          // Listen for storage changes
          chrome.storage.onChanged.addListener((changes: any, namespace: any) => {
            if (namespace === 'local' && changes.currentVideoId) {
              console.log("Video ID changed in storage:", changes.currentVideoId.newValue);
              setCurrentVideoId(changes.currentVideoId.newValue);
              setError(null);
            }
          });

        } else {
          console.warn("Chrome extension API not available");
          setError("Chrome extension API not available");
        }
      } catch (error) {
        console.error("Failed to initialize Chrome extension communication:", error);
        setError("Failed to initialize Chrome extension communication");
      }
    };

    initializeChromeConnection();

    return () => {
      try {
        if (port) {
          port.disconnect();
          console.log("Chrome extension port disconnected");
        }
      } catch (error) {
        console.error("Error disconnecting Chrome extension port:", error);
      }
    };
  }, []);

  // Auto-initialize video when currentVideoId changes and user is authenticated
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
  useEffect(() => {
    if (currentVideoId && session?.user?.id) {
      console.log("Auto-initializing video:", currentVideoId);
      handleInitializeVideo(currentVideoId);
    }
  }, [currentVideoId, session?.user?.id, handleInitializeVideo]);



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