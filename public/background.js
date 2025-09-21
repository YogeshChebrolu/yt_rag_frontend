// Store the latest video ID in background script
let currentVideoId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "VIDEO_ID_UPDATE") {
      console.log("Background got new video_id:", message.video_id);
      
      // Store the video ID in background script
      currentVideoId = message.video_id;
      
      // Store in chrome storage for side panel to access
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

// Handle side panel connection and send current video ID
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sidepanel") {
    console.log("Side panel connected");
    
    // Send current video ID to side panel when it connects
    if (currentVideoId) {
      port.postMessage({
        type: "VIDEO_ID_UPDATE",
        video_id: currentVideoId
      });
    }
    
    port.onDisconnect.addListener(() => {
      console.log("Side panel disconnected");
    });
  }
});

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open the side panel for the current tab
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log("Side panel opened for tab:", tab.id);
  } catch (error) {
    console.error("Failed to open side panel:", error);
  }
});

// Auto-open side panel when user navigates to YouTube
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    try {
      // Auto-open side panel when on YouTube video page
      await chrome.sidePanel.open({ tabId: tabId });
      console.log("Auto-opened side panel for YouTube video:", tab.url);
    } catch (error) {
      console.error("Failed to auto-open side panel:", error);
    }
  }
});