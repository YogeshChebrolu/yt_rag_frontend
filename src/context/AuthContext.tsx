import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase";

export interface SessionContextInterface {
  session: Session | null;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
}

const SessionContext = createContext<SessionContextInterface | null>(null)

interface sessionContextProviderProps {
  children: ReactNode
}

export const SessionContextProvider = ({children}: sessionContextProviderProps)=>{
  const [session, setSession] = useState<Session | null>(null);
  const isAuthenticated = !!session;



  useEffect(()=>{
    const getSession = async () => {
      const sessionData = await supabase.auth.getSession();
      setSession(sessionData?.data?.session)
    };
    console.log(session)

    void getSession();

    supabase.auth.onAuthStateChange((_event, session)=>{
      setSession(session);
    })
  }, [])
  
  return (
    <SessionContext.Provider value={{session, isAuthenticated, setSession}}>
      {children}
    </SessionContext.Provider>
  )
}


function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context;
}

export { SessionContext, useSession};