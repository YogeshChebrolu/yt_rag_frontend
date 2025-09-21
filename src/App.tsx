import './App.css'
import { useSession } from './context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

function App() {
  const { session } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    console.log("In app tsx session: ", session)
    // Auto-navigate based on authentication status
    if (session) {
      navigate('/chat')
    } else {
      navigate('/auth')
    }
  }, [session, navigate])

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

export default App
