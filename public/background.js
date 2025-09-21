chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "VIDEO_ID_UPDATE") {
      console.log("Background got new video_id:", message.video_id);
      
      // Forward message to popup if it's open, with proper error handling
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            // This is expected when popup is not open, so we'll just log it
            console.log("Popup not available to receive message:", chrome.runtime.lastError.message);
          }
        });
      } catch (error) {
        console.error("Failed to forward message to popup:", error);
      }
      
      // Send response back to content script
      sendResponse({ success: true });
    }
    
    // Return true to indicate we will send a response asynchronously
    return true;
  });