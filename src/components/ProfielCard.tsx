import { useSession } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "./ui/dropdown-menu"
import { DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { ChevronDown, LogOut, Settings } from "lucide-react"

export function ProfileCard(){
  const { session } = useSession()
  
  const [userEmail, setUserEmail] = useState<string>("")
  
  useEffect(()=>{
    if (session) {
      const email: string = session?.user?.email!
      setUserEmail(email)
    }
  }, [session]);

  const handelLogOut = async (e: MouseEvent) => {
    try{
      e.preventDefault()
      const { error } = await supabase.auth.signOut()
      if ( error ) {
        console.error("Error occured during signOut")
      }
    } catch ( error ) {
      console.error("Error during signOut")
    }
  }

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase()
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2 hover:bg-muted/50 transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gray-800 text-white text-xs font-medium">
              {getInitials(userEmail)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="w-3 h-3 text-muted-foreground"/>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-popover border shadow-lg"
        sideOffset={8}
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">Account</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator/>

        <DropdownMenuItem className="cursor-pointer focus:bg-muted/50">
          <Settings className="w-4 h-4 mr-2"/>
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer focus:bg-destructive/10 focus:text=destructive"
          onClick={handelLogOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>



    </DropdownMenu>
  )

}