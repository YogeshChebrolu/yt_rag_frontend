import { sendChatMessage } from "@/api/chat";
import { useSession } from "@/context/AuthContext";
import { useVideoContext } from "@/context/VideoContext";
import { useState, useEffect, useRef } from "react"
import { ChatMessage } from "./ChatMessage";
import { VideoStatus } from "./VideoStatus";
import { ProfileCard } from "./ProfileCard";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Paperclip, Send, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: Date;
  video_id?: string;
}

export function ChatPage() {
  const { session } = useSession()
  const { 
    currentVideoId, 
    videoStatus, 
    chatHistory, 
    setChatHistory, 
    error: videoError
  } = useVideoContext()
  
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousVideoIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Load chat history when video ID changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!currentVideoId || !session?.user?.id) {
        return;
      }

      // Only load if video ID actually changed
      if (previousVideoIdRef.current === currentVideoId) {
        return;
      }

      previousVideoIdRef.current = currentVideoId;
      setIsLoadingHistory(true);
      setChatError(null);

      try {
        const { getChatHistory } = await import("@/api/chat");
        const historyResponse = await getChatHistory({ video_id: currentVideoId });
        
        if (Array.isArray(historyResponse)) {
          // Convert API response to Message format
          const formattedHistory: Message[] = historyResponse.map((msg: any) => ({
            id: msg.id || Date.now().toString(),
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            video_id: msg.video_id
          }));
          setChatHistory(formattedHistory);
        } else {
          // If no history or error, start with welcome message
          const welcomeMessage: Message = {
            id: "welcome",
            role: "ASSISTANT",
            content: "Hi! I'm YT Chat. I can help you analyze this video and provide insights. What would you like to know?",
            timestamp: new Date(),
            video_id: currentVideoId
          };
          setChatHistory([welcomeMessage]);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setChatError("Failed to load chat history. You can still send new messages.");
        
        // Set welcome message even if history loading fails
        const welcomeMessage: Message = {
          id: "welcome",
          role: "ASSISTANT", 
          content: "Hi! I'm YT Chat. I can help you analyze this video and provide insights. What would you like to know?",
          timestamp: new Date(),
          video_id: currentVideoId
        };
        setChatHistory([welcomeMessage]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [currentVideoId, session?.user?.id, setChatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isTyping) return;
    
    // Validate that video is processed and ready
    if (videoStatus !== 'READY') {
      setChatError("Please wait for the video to be processed before sending messages.");
      return;
    }

    if (!currentVideoId || !session?.user?.id) {
      setChatError("Missing video ID or user session. Please refresh and try again.");
      return;
    }

    setIsTyping(true);
    setChatError(null);
    const messageText = newMessage;
    setNewMessage(""); // Clear input immediately

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "USER",
      content: messageText,
      timestamp: new Date(),
      video_id: currentVideoId
    };

    setChatHistory(prev => [...prev, userMessage]);

    try {
      const aiResponse = await sendChatMessage({
        query: messageText,
        video_id: currentVideoId,
        user_id: session.user.id
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "ASSISTANT",
        content: typeof aiResponse === 'string' ? aiResponse : aiResponse?.content || "Sorry, I couldn't process your request.",
        timestamp: new Date(),
        video_id: currentVideoId
      };

      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setChatError("Failed to send message. Please try again.");
      
      // Remove the user message if sending failed
      setChatHistory(prev => prev.filter(msg => msg.id !== userMessage.id));
      setNewMessage(messageText); // Restore the message text
    } finally {
      setIsTyping(false);
    }
  }

  const handleRetryMessage = () => {
    setChatError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  // Determine if chat should be disabled
  const isChatDisabled = videoStatus !== 'READY' || isTyping || !currentVideoId || !session?.user?.id;
  
  // Get placeholder text based on video status
  const getPlaceholderText = () => {
    switch (videoStatus) {
      case 'NOT_PROCESSED':
        return "Process the video first to start chatting";
      case 'PROCESSING':
        return "Video is being processed...";
      case 'ERROR':
        return "Video processing failed";
      case 'IDLE':
        return "Loading video status...";
      case 'READY':
        return "Ask about the video";
      default:
        return "Ask about the video";
    }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header with Profile */}
      <div className="border-b bg-card p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold text-foreground">YT Chat</h1>
        </div>
        <ProfileCard />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-chat">
        <VideoStatus />
        
        {/* Loading History Indicator */}
        {isLoadingHistory && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading chat history...</span>
            </div>
          </div>
        )}

        {/* Chat Error Alert */}
        {chatError && (
          <Alert className="border-destructive/50 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{chatError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetryMessage}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Video Error Alert */}
        {videoError && (
          <Alert className="border-destructive/50 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{videoError}</AlertDescription>
          </Alert>
        )}

        {/* Chat Messages */}
        {chatHistory.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-ai-message text-ai-message-foreground rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%] shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Messages Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={getPlaceholderText()}
              className="pr-12 rounded-full border-border/50 focus:border-primary transition-colors"
              disabled={isChatDisabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full p-0 hover:bg-muted"
              disabled={isChatDisabled}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>

          <Button
            type="submit"
            disabled={!newMessage.trim() || isChatDisabled}
            className="w-10 h-10 rounded-full p-0 bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};