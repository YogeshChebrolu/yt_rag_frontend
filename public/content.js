
function extractVideoId(url) {
    const params = new URLSearchParams(new URL(url).search);
    return params.get("v");
  }
  
  let lastVideoId = null;
  
  const observer = new MutationObserver(() => {
    const videoId = extractVideoId(location.href);
    if (videoId && videoId !== lastVideoId) {
      lastVideoId = videoId;
      console.log("Video change detected:", videoId);
      chrome.runtime.sendMessage({ type: "VIDEO_ID_UPDATE", videoId });
    }
  });
  
  observer.observe(document.querySelector("title"), {
    childList: true,
  });
  console.log("testing")