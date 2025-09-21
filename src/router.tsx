import { createHashRouter } from "react-router-dom";
import App from "./App";

// Use hash router for browser extension compatibility
// Simplified routing - App.tsx now handles conditional rendering based on auth state
export const router = createHashRouter([
    { 
        path: "/", 
        element: <App />,
        errorElement: <div className="text-center p-4 text-red-500">Something went wrong! Please try again.</div>
    },
    // Catch-all route to redirect to main app
    {
        path: "*",
        element: <App />,
        errorElement: <div className="text-center p-4 text-red-500">Page not found! Redirecting to main app.</div>
    }
], {
    // Add fallback for extension context
    future: {
        v7_normalizeFormMethod: true,
    }
})