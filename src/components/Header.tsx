import { MessageCircle } from "lucide-react";
import { ProfileCard } from "./ProfielCard";

const Header = async () => {
    return (
      <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
              <MessageCircle className="w-4 h-4 text-white"/>
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">YouTube AI</h1>
            <p className="text-xs text-muted-foreground">Video Assistant</p>
          </div>
        </div>

        <ProfileCard />
      </header>
    )
}