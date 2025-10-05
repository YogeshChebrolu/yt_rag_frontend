import './App.css'
import { useSession } from './context/AuthContext'
import { AuthPage } from './components/AuthPage'
import { ChatPage } from './components/chat/ChatPage'

function App() {
  const { session, isAuthenticated, isLoading } = useSession()

  console.log("App.tsx session state:", { session, isAuthenticated, isLoading })

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-full text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-3">
            YouTube RAG Assistant
          </h1>
          <p className="text-gray-600 mb-4 text-sm">
            Loading your personalized YouTube chat experience...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Conditional rendering based on authentication state
  return (
    <div className="w-full h-full bg-white">
      {isAuthenticated ? <ChatPage /> : <AuthPage />}
    </div>
  )
}

export default App
