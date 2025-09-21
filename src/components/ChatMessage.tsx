// Removed unused imports - Clock and ExternalLink are commented out in the JSX

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage( { message } : ChatMessageProps){
  const isUser = message.role === "USER";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
        {/* Message Bubble */}
        <div
          className={`
            rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadown-md
            ${
              isUser
              ? "bg-user-message text-user-message-foreground rounded-br-md"
              : "bg-ai-message text-ai-message-foreground rounded-bl-md"
            }
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-warp">
            {message.content}
          </p>

          {/* Image if present */}
          {/* {message.image && (
            <div className="mt-3">
              <img
                src={message.image}
                alt="Relevant frames"
                className="rounded-lg max-w-full h-auto shadow-sm"
              />
            </div>
          )} */}

          {/* Links if present */}
          {/* {message.links && message.links.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className={`
                    flex items-center space-x-2 text-xs rounded-lg px-3 py-2 transition-colors hover:opacity-80
                    ${
                      isUser
                      ? "bg-white/20 text-user-message-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                    }
                  `}
                >
                  {link.timestamp ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <ExternalLink className="w-3 h-3" />
                  )}
                  <span>{link.text}</span>
                  {link.timestamp && (
                    <span className="ml-auto font-mono text-xs opacity-75">
                      {link.timestamp}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )} */}
        </div>
        {/* Timestamp */}
        <div className={`mt-1 px-2 ${isUser ? "text-right" : "text-left"}`}>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit", 
            })}
          </span>
        </div>
      </div>
    </div>
  );
};