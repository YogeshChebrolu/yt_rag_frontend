// Store the latest video ID in background script
let currentVideoId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "VIDEO_ID_UPDATE") {
      console.log("Background got new video_id:", message.video_id);
      
      // Store the video ID in background script
      currentVideoId = message.video_id;
      
      // Store in chrome storage for popup to access
      try {
        chrome.storage.local.set({ 
          currentVideoId: message.video_id,
          lastUpdate: Date.now()
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Failed to store video ID:", chrome.runtime.lastError.message);
          } else {
            console.log("Video ID stored successfully:", message.video_id);
          }
        });
      } catch (error) {
        console.error("Failed to store video ID:", error);
      }
      
      // Send response back to content script
      sendResponse({ success: true });
    }
    
    // Return true to indicate we will send a response asynchronously
    return true;
  });

// Handle popup connection and send current video ID
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    console.log("Popup connected");
    
    // Send current video ID to popup when it connects
    if (currentVideoId) {
      port.postMessage({
        type: "VIDEO_ID_UPDATE",
        video_id: currentVideoId
      });
    }
    
    port.onDisconnect.addListener(() => {
      console.log("Popup disconnected");
    });
  }
});