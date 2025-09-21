chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "VIDEO_ID_UPDATE") {
      console.log("Background got new videoId:", message.videoId);
      // optionally keep track, or forward to popup if open
      chrome.runtime.sendMessage(message);
    }
  });