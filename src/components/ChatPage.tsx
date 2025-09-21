import { sendChatMessage } from "@/api/chat";
import { useSession } from "@/context/AuthContext";
import { useVideoContext } from "@/context/VideoContext";
import {useState, useEffect, useCallback, useRef } from "react"
import { ChatMessage } from "./ChatMessage";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Paperclip, Send } from "lucide-react";
interface Message {
    id: string;
    role: "USER" | "ASSISTANT";
    content: string;
    timestamp: Date;
    // image?: string[];
    // links?: Array<{ text: string, url: string, timestamp?: string }>;
}

export function ChatPage(){
  const { session } = useSession()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ASSISTANT",
      content: "Hi! I'm YT Chat. I can help you analyze videos and provide insights. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [ newMessage, setNewMessage ] = useState("");
  const [ isTyping, setIsTyping ] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentVideoId, chatHistory } = useVideoContext()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const retrieveChatHistory = async () => {
    const history = await 
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTyping(true);
    if (!newMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "USER",
      content: newMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // AI response
    const aiResponse = await sendChatMessage({
      "query": newMessage,
      "video_id": currentVideoId!,
      "user_id": session?.user?.id!
    });
    const aiMessage: Message = {
      id: aiResponse["id"],
      role: "ASSISTANT",
      content: aiResponse["content"],
      timestamp: aiResponse["timestamp"],
    }

    setMessages(prev => [...prev, aiMessage])
    setIsTyping(true)
  }

  return (
    <div className="h-screen w-full max-w-sm mx-auto flex flex-col bg-background">
      {/*Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-chat">
        {messages.map((message)=>(
          <ChatMessage key={message.id} message={message}/>
        ))}

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

      {/** Messages Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage}  className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask about the video"
              className="pr-12 rounded-full border-border/50 focus:border-primary transaction-colors"
              disabled={isTyping}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full p-0 hover:bg-muted"
            >
              <Paperclip className="w-4 h-4"/>
            </Button>
          </div>

          <Button
            type="submit"
            disabled={!newMessage.trim() || isTyping}
            className="w-10 h-10 rounded-full p-0 bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};