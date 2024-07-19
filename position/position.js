require("dotenv").config();

const positionPubUrl = process.env.POSITION_PUB_URL;
const positionSubUrl = process.env.POSITION_SUB_URL;

const positionPubSocket = new WebSocket(positionPubUrl);
const positionSubSocket = new WebSocket(positionSubUrl);

/**
 * WebSocket 연결을 여는 함수
 */
function openWebSocketConnections() {
  positionPubSocket = new WebSocket(positionPubUrl);
  positionSubSocket = new WebSocket(positionSubUrl);

  positionPubSocket.onopen = () => {
    console.log("Publisher WebSocket connection opened.");
  };

  positionSubSocket.onopen = () => {
    console.log("Subscriber WebSocket connection opened.");
  };

  positionPubSocket.onerror = (error) => {
    console.error("Publisher WebSocket error:", error);
  };

  positionSubSocket.onerror = (error) => {
    console.error("Subscriber WebSocket error:", error);
  };

  positionPubSocket.onclose = () => {
    console.log("Publisher WebSocket connection closed.");
  };

  positionSubSocket.onclose = () => {
    console.log("Subscriber WebSocket connection closed.");
  };
}

/**
 * WebSocket 연결을 닫는 함수
 */
function closeWebSocketConnections() {
  if (positionPubSocket) {
    positionPubSocket.close();
  }
  if (positionSubSocket) {
    positionSubSocket.close();
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

function subscribePositionData(callback) {
  positionSubSocket.onmessage = (event) => {
    const data = decodeBufferToText(event.data);
    callback(data);
  };
}

function unsubscribePositionData() {
  positionSubSocket.onmessage = null;
}

function publishPositionData(data) {
  const buffer = encodeTextToBuffer(data);
  positionPubSocket.send(buffer);
}

// NOTE: HTML 파일에서 호출할 수 있는 함수를 전역으로 노출
window.openWebSocketConnections = openWebSocketConnections;
window.closeWebSocketConnections = closeWebSocketConnections;
window.subscribePositionData = subscribePositionData;
window.unsubscribePositionData = unsubscribePositionData;
window.publishPositionData = publishPositionData;
