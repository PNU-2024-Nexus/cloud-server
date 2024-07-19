require("dotenv").config();

const videoPubUrl = process.env.VIDEO_PUB_URL;
const videoSubUrl = process.env.VIDEO_SUB_URL;

const videoPubSocket = new WebSocket(videoPubUrl);
const videoSubSocket = new WebSocket(videoSubUrl);

/**
 * WebSocket 연결을 여는 함수
 */
function openWebSocketConnections() {
  videoPubSocket = new WebSocket(videoPubUrl);
  videoSubSocket = new WebSocket(videoSubUrl);

  videoPubSocket.onopen = () => {
    console.log("Publisher WebSocket connection opened.");
  };

  videoSubSocket.onopen = () => {
    console.log("Subscriber WebSocket connection opened.");
  };

  videoPubSocket.onerror = (error) => {
    console.error("Publisher WebSocket error:", error);
  };

  videoSubSocket.onerror = (error) => {
    console.error("Subscriber WebSocket error:", error);
  };

  videoPubSocket.onclose = () => {
    console.log("Publisher WebSocket connection closed.");
  };

  videoSubSocket.onclose = () => {
    console.log("Subscriber WebSocket connection closed.");
  };
}

/**
 * WebSocket 연결을 닫는 함수
 */
function closeWebSocketConnections() {
  if (videoPubSocket) {
    videoPubSocket.close();
  }
  if (videoSubSocket) {
    videoSubSocket.close();
  }
}

/**
 * 텍스트 데이터를 버퍼로 인코딩하는 함수
 */
function encodeTextToBuffer(text) {
  return new TextEncoder().encode(text);
}

/**
 * 버퍼를 텍스트 데이터로 디코딩하는 함수
 */
function decodeBufferToText(buffer) {
  return new TextDecoder().decode(buffer);
}

function subscribeVideoData(callback) {
  videoSubSocket.onmessage = (event) => {
    const data = decodeBufferToText(event.data);
    callback(data);
  };
}

function unsubscribeVideoData() {
  videoSubSocket.onmessage = null;
}

function publishVideoData(data) {
  const buffer = encodeTextToBuffer(data);
  videoPubSocket.send(buffer);
}

// NOTE: HTML 파일에서 호출할 수 있는 함수를 전역으로 노출
window.openWebSocketConnections = openWebSocketConnections;
window.closeWebSocketConnections = closeWebSocketConnections;
window.subscribeVideoData = subscribeVideoData;
window.unsubscribeVideoData = unsubscribeVideoData;
window.publishVideoData = publishVideoData;
