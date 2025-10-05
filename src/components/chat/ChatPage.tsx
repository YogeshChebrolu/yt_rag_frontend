import { sendChatMessage } from "@/api/chat";
import { createNotes } from "@/api/notes";
import { useSession } from "@/context/AuthContext";
import { useVideoContext } from "@/context/VideoContext";
import { useState, useEffect, useRef, useMemo } from "react"
import { ChatMessage } from "./ChatMessage";
import { VideoStatus } from "../VideoStatus";
import { ProfileCard } from "../profile/ProfileCard";
import { Button } from "../ui/button";
import { Paperclip, Send, AlertCircle, RefreshCw, FilePlus2 } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Textarea } from "../ui/textarea";
import ReactMarkdown from "react-markdown";
import { UpdateNotesStatusDialog } from "../notes/UpdateNotesStatusDialog";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: Date;
  video_id?: string;
}

interface NotesContent {
  notes_id: string;
  content: string;
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
  const [inputMode, setInputMode] = useState<"attach" | "notes" | "normal">("normal")

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previousVideoIdRef = useRef<string | null>(null);

  const [ showUpdateNotesStatus, setShowUpdateNotesStatus ] = useState<boolean>(false);
  const [ notesContent, setNotesContent ] = useState<NotesContent | null>(null);

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
        
        if (historyResponse && Array.isArray(historyResponse.history)) {
          // Convert API response to Message format
          const formattedHistory: Message[] = historyResponse.history.map((msg: any) => ({
            id: msg.id,
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
      if (inputMode === "normal"){
        const aiResponse = await sendChatMessage({
          query: messageText,
          video_id: currentVideoId,
          // user_id: session.user.id
        });
        console.log(aiResponse)
  
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: "ASSISTANT",
          content: typeof aiResponse === 'string' ? aiResponse : aiResponse?.content || "Sorry, I couldn't process your request.",
          timestamp: new Date(),
          video_id: currentVideoId
        };
  
        setChatHistory(prev => [...prev, aiMessage]);
      } else if(inputMode === "notes"){
        console.log("Enter create notes handler")
        const notesResponse = await createNotes({
          query: messageText,
          video_id: currentVideoId,
        })
        console.log("Reply from create notes api:", notesResponse)
        setShowUpdateNotesStatus(true);
        setNotesContent({
          "notes_id": notesResponse.notes_id,
          "content": notesResponse.content
        })

      }
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
  
  // Get placeholder text based on video status - using useMemo for performance
  const inputPlaceholder = useMemo(() => {
    switch(videoStatus){
      case "NOT_PROCESSED":
        return "Process the video first to start chatting...";
      case "PROCESSING":
        return "Video is being processed...";
      case "ERROR":
        return "Video processing failed...";
      case "IDLE":
        return "Loading video status...";
      case "READY":
        if (inputMode === "attach"){
          return "Attach notes to get response related to the notes...";
        }
        else if(inputMode === "normal"){
          return "Ask about the video...";
        }
        else{
          return "Provide a query to create notes..."
        }


      default:
        return "Ask about the video...";
    }
  }, [videoStatus, inputMode]);

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header with Profile */}
      <div className="border-b bg-card p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src="/icons/logo.png"
            alt="Logo"
            className="w-7 h-7 rounded"
            style={{ objectFit: "contain" }}
          />
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
                <div className="w-2 h-2 bg-black/40 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-black/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-black/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}


        <div ref={messagesEndRef} />
      </div>

      {/* Messages Input */}
      <div className="bg-card pt-4 ml-2">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            {/* <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={getPlaceholderText()}
              className="pr-12 rounded-full border-border/50 focus:border-primary transition-colors"
              disabled={isChatDisabled}
            /> */}
            <Textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e)=> setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={inputPlaceholder}
              className="p-4 rounded-full border-border/50 transition-colors"
              disabled={isChatDisabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full p-0 hover:bg-muted"
              disabled={isChatDisabled}
            />
          </div>

          <Button
            type="submit"
            disabled={!newMessage.trim() || isChatDisabled}
            className="w-10 h-10 rounded-full p-0 bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="flex items-center mt-2 space-x-2">
          <div>
            <Button 
            className={`rounded-full w-auto text-sm transition-colors ${
                inputMode==="attach"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={()=>{
              if(inputMode==="attach"){
                setInputMode("normal")
              }else{
                setInputMode("attach")
              }
            }}
            >
              <Paperclip className="w-4 h-4"/>
              Attach Notes
            </Button>
          </div>
          <div>
            <Button 
            className={`rounded-full w-auto text-sm transition-colors ${
              inputMode==="notes"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={()=>{
              if(inputMode==="notes"){
                setInputMode("normal")
              }else{
                setInputMode("notes")
              }
            }}
            >
              <FilePlus2 className="w-4 h-4"/>
              Create Notes
            </Button>
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground text-center py-2">
        <ReactMarkdown>
          **Enter** to `send` and **Shift+Enter** to `new line`
        </ReactMarkdown>
      </div>
      {showUpdateNotesStatus && (
        <UpdateNotesStatusDialog 
          open={showUpdateNotesStatus}
          onOpenChange={setShowUpdateNotesStatus}
          notesContent={notesContent}
        />
      )}
    </div>
  );
};