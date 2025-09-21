import { createHashRouter } from "react-router-dom";
import App from "./App";
import { AuthPage } from "./components/AuthPage";
import { PrivateRoute } from "./components/PrivateRoute";
import { ChatMessage } from "./components/ChatMessage";

// Use hash router for browser extension compatibility
export const router = createHashRouter([
    { 
        path: "/", 
        element: <App />,
        errorElement: <div className="text-center p-4 text-red-500">Something went wrong! Please try again.</div>
    },
    { 
        path: "/auth", 
        element: <AuthPage />,
        errorElement: <div className="text-center p-4 text-red-500">Authentication error! Please try again.</div>
    },
    { 
        path: "/chat",
        element: <PrivateRoute><ChatMessage /></PrivateRoute>,
        errorElement: <div className="text-center p-4 text-red-500">Chat error! Please try again.</div>
    }
], {
    // Add fallback for extension context
    future: {
        v7_normalizeFormMethod: true,
    }
})