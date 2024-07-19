require("dotenv").config();

const lidarPubUrl = process.env.LIDAR_PUB_URL;
const lidarSubUrl = process.env.LIDAR_SUB_URL;

const lidarPubSocket = new WebSocket(lidarPubUrl);
const lidarSubSocket = new WebSocket(lidarSubUrl);

/**
 * WebSocket 연결을 여는 함수
 */
function openWebSocketConnections() {
  lidarPubSocket = new WebSocket(lidarPubUrl);
  lidarSubSocket = new WebSocket(lidarSubUrl);

  lidarPubSocket.onopen = () => {
    console.log("Publisher WebSocket connection opened.");
  };

  lidarSubSocket.onopen = () => {
    console.log("Subscriber WebSocket connection opened.");
  };

  lidarPubSocket.onerror = (error) => {
    console.error("Publisher WebSocket error:", error);
  };

  lidarSubSocket.onerror = (error) => {
    console.error("Subscriber WebSocket error:", error);
  };

  lidarPubSocket.onclose = () => {
    console.log("Publisher WebSocket connection closed.");
  };

  lidarSubSocket.onclose = () => {
    console.log("Subscriber WebSocket connection closed.");
  };
}

/**
 * WebSocket 연결을 닫는 함수
 */
function closeWebSocketConnections() {
  if (lidarPubSocket) {
    lidarPubSocket.close();
  }
  if (lidarSubSocket) {
    lidarSubSocket.close();
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

function subscribeLidarData(callback) {
  lidarSubSocket.onmessage = (event) => {
    const data = decodeBufferToText(event.data);
    callback(data);
  };
}

function unsubscribeLidarData() {
  lidarSubSocket.onmessage = null;
}

function publishLidarData(data) {
  const buffer = encodeTextToBuffer(data);
  lidarPubSocket.send(buffer);
}

// NOTE: HTML 파일에서 호출할 수 있는 함수를 전역으로 노출
window.openWebSocketConnections = openWebSocketConnections;
window.closeWebSocketConnections = closeWebSocketConnections;
window.subscribeLidarData = subscribeLidarData;
window.unsubscribeLidarData = unsubscribeLidarData;
window.publishLidarData = publishLidarData;
