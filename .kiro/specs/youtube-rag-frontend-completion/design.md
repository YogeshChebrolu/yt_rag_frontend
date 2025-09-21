# Design Document

## Overview

The YouTube RAG Chrome extension frontend is designed as a popup-based interface that provides seamless video-specific chat functionality. The design leverages existing React components, Supabase authentication, and Chrome extension APIs to create a cohesive user experience. The architecture focuses on state management through React contexts, efficient API communication, and responsive UI components using Shadcn UI and Tailwind CSS.

## Architecture

### Component Hierarchy
```
App
├── AuthContextProvider
│   └── VideoContextProvider
│       ├── AuthPage (conditional)
│       └── ChatInterface (conditional)
│           ├── VideoStatus
│           ├── ChatPage
│           │   └── ChatMessage[]
│           └── ProfileCard
```

### State Management
- **AuthContext**: Manages user authentication state, session handling, and logout functionality
- **VideoContext**: Manages current video ID, processing status, chat history, and video-related operations
- **Local Component State**: Handles UI-specific states like loading, typing indicators, and form inputs

### Chrome Extension Integration
- **Content Script**: Detects YouTube video ID changes and sends messages to the extension
- **Background Script**: Forwards messages between content script and popup
- **Popup**: React application that receives video ID updates and manages the chat interface

## Components and Interfaces

### Enhanced VideoContext
```typescript
interface VideoContextProps {
  currentVideoId: string | null;
  setCurrentVideoId: (id: string | null) => void;
  videoStatus: 'IDLE' | 'NOT_PROCESSED' | 'PROCESSING' | 'READY' | 'ERROR';
  setVideoStatus: (status: VideoStatus) => void;
  chatHistory: Message[];
  setChatHistory: (messages: Message[]) => void;
  error: string | null;
  setError: (error: string | null) => void;
  initializeVideo: (videoId: string) => Promise<void>;
  processVideo: (videoId: string) => Promise<void>;
  loadChatHistory: (videoId: string) => Promise<void>;
}
```

### Message Interface
```typescript
interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: Date;
  video_id: string;
}
```

### VideoStatus Component
- **Purpose**: Display current video processing status and provide processing controls
- **States**: 
  - Not Processed: Shows process button
  - Processing: Shows loading indicator, disables interactions
  - Ready: Shows success indicator, enables chat
  - Error: Shows error message with retry option
- **Design**: Card-based layout at the top of chat interface with clear status indicators

### ChatPage Component Enhancements
- **Chat History Loading**: Automatic loading when video ID changes
- **Message State Management**: Proper handling of message sending and receiving
- **Input Validation**: Disable input when video is not ready
- **Auto-scroll**: Smooth scrolling to latest messages
- **Error Handling**: Graceful error display and retry mechanisms

### ProfileCard Component
- **Purpose**: Display user information and provide logout functionality
- **Design**: Compact card with user avatar, name, and logout button
- **Placement**: Top-right corner or dedicated profile section

### AuthPage Component Updates
- **Current State**: Already well-implemented with Supabase integration
- **Enhancements**: Add better error handling and loading states

## Data Models

### Video Processing Status Flow
```
IDLE → NOT_PROCESSED → PROCESSING → READY
  ↓         ↓             ↓         ↓
ERROR ←── ERROR ←──── ERROR    SUCCESS
```

### Chat History Management
- **Storage**: Backend database with (videoId, userId) as composite key
- **Caching**: Local state caching for current session
- **Synchronization**: Fetch on video change, update on new messages

### Authentication Flow
```
Extension Load → Check Session → Authenticated? 
                                      ↓
                               Yes: Chat Interface
                                      ↓
                               No: Auth Page → Login/Signup → Chat Interface
```

## Error Handling

### API Error Handling
- **Network Errors**: Display retry buttons with exponential backoff
- **Authentication Errors**: Redirect to auth page with appropriate messaging
- **Video Processing Errors**: Show error status with manual retry option
- **Chat Errors**: Display inline error messages without breaking the chat flow

### Chrome Extension Error Handling
- **Content Script Failures**: Graceful degradation with manual video ID input option
- **Message Passing Errors**: Fallback mechanisms and error logging
- **Popup Communication**: Robust message handling with timeout mechanisms

### User Experience Error Handling
- **Loading States**: Clear loading indicators for all async operations
- **Empty States**: Appropriate messaging for empty chat history or no video
- **Offline Handling**: Basic offline detection and user notification

## Testing Strategy

### Unit Testing
- **Context Providers**: Test state management and API integration
- **Components**: Test rendering, user interactions, and prop handling
- **API Functions**: Test request/response handling and error scenarios
- **Utility Functions**: Test video ID extraction and message formatting

### Integration Testing
- **Authentication Flow**: Test complete login/logout cycles
- **Video Processing Flow**: Test status detection and processing initiation
- **Chat Flow**: Test message sending, receiving, and history loading
- **Chrome Extension Integration**: Test message passing between scripts

### Manual Testing
- **Chrome Extension Installation**: Test extension loading and popup functionality
- **YouTube Integration**: Test video ID detection across different YouTube pages
- **Cross-browser Compatibility**: Test on different Chrome versions
- **Responsive Design**: Test popup sizing and component responsiveness

## Implementation Approach

### Phase 1: Core Infrastructure
1. Enhance VideoContext with complete state management
2. Fix Chrome extension message handling
3. Implement proper error boundaries and loading states

### Phase 2: Video Processing
1. Complete VideoStatus component implementation
2. Integrate video processing API calls
3. Implement status polling and real-time updates

### Phase 3: Chat Functionality
1. Implement chat history loading and management
2. Enhance message sending and receiving
3. Add proper error handling and retry mechanisms

### Phase 4: User Interface
1. Create ProfileCard component
2. Enhance UI with proper loading states and animations
3. Implement responsive design and accessibility features

### Phase 5: Testing and Polish
1. Add comprehensive error handling
2. Implement proper loading and empty states
3. Add user feedback mechanisms and polish UI interactions