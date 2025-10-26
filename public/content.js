
function extractVideoId(url) {
    const params = new URLSearchParams(new URL(url).search);
    return params.get("v");
  }
  
  let lastVideoId = null;
  
  const observer = new MutationObserver(() => {
    const videoId = extractVideoId(location.href);
    const videoTitle = document.getElementsByTagName("h1")[2].innerText;
    const videoChannel = document.getElementsByClassName("style-scope ytd-channel-name")[0].innerText
    if (videoId && videoId !== lastVideoId) {
      lastVideoId = videoId;
      console.log("Video change detected with title and channel:", videoId, videoTitle, videoChannel);
      
      // Send message with proper error handling and correct property name
      try {
        chrome.runtime.sendMessage({ 
          type: "VIDEO_ID_UPDATE", 
          video_id: videoId,
          video_title: videoTitle,
          video_channel: videoChannel
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending video ID update:", chrome.runtime.lastError.message);
          }
        });
      } catch (error) {
        console.error("Failed to send video ID update:", error);
      }
    }
  });
  
  // Add error handling for observer setup
  try {
    const titleElement = document.querySelector("title");
    if (titleElement) {
      observer.observe(titleElement, {
        childList: true,
      });
      console.log("YouTube video observer initialized");
    } else {
      console.warn("Could not find title element to observe");
    }
  } catch (error) {
    console.error("Failed to initialize video observer:", error);
  }
  
  // Also check for initial video ID on page load
  try {
    const initialVideoId = extractVideoId(location.href);
    if (initialVideoId) {
      lastVideoId = initialVideoId;
      chrome.runtime.sendMessage({ 
        type: "VIDEO_ID_UPDATE", 
        video_id: initialVideoId 
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending initial video ID:", chrome.runtime.lastError.message);
        }
      });
    }
  } catch (error) {
    console.error("Failed to send initial video ID:", error);
  }