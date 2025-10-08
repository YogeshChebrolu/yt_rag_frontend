import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from "./router"
import { SessionContextProvider } from "./context/AuthContext"
import { VideoContextProvider } from "./context/VideoContext"
import { NotesContextProvider } from './context/NotesContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionContextProvider>
      <VideoContextProvider>
        <NotesContextProvider>
        <RouterProvider router={router}/>
        </NotesContextProvider>
      </VideoContextProvider>
    </SessionContextProvider>
  </StrictMode>
)
