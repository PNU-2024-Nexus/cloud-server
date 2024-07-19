require("dotenv").config();

const robotControlPubUrl = process.env.ROBOTCONTROL_PUB_URL;
const robotControlSubUrl = process.env.ROBOTCONTROL_SUB_URL;

const robotControlPubSocket = new WebSocket(robotControlPubUrl);
const robotControlSubSocket = new WebSocket(robotControlSubUrl);

/**
 * WebSocket 연결을 여는 함수
 */
function openWebSocketConnections() {
  robotControlPubSocket = new WebSocket(robotControlPubUrl);
  robotControlSubSocket = new WebSocket(robotControlSubUrl);

  robotControlPubSocket.onopen = () => {
    console.log("Publisher WebSocket connection opened.");
  };

  robotControlSubSocket.onopen = () => {
    console.log("Subscriber WebSocket connection opened.");
  };

  robotControlPubSocket.onerror = (error) => {
    console.error("Publisher WebSocket error:", error);
  };

  robotControlSubSocket.onerror = (error) => {
    console.error("Subscriber WebSocket error:", error);
  };

  robotControlPubSocket.onclose = () => {
    console.log("Publisher WebSocket connection closed.");
  };

  robotControlSubSocket.onclose = () => {
    console.log("Subscriber WebSocket connection closed.");
  };
}

/**
 * WebSocket 연결을 닫는 함수
 */
function closeWebSocketConnections() {
  if (robotControlPubSocket) {
    robotControlPubSocket.close();
  }
  if (robotControlSubSocket) {
    robotControlSubSocket.close();
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

function subscribeRobotControlData(callback) {
  robotControlSubSocket.onmessage = (event) => {
    const data = decodeBufferToText(event.data);
    callback(data);
  };
}

function unsubscribeRobotControlData() {
  robotControlSubSocket.onmessage = null;
}

function publishRobotControlData(data) {
  const buffer = encodeTextToBuffer(data);
  robotControlPubSocket.send(buffer);
}

// NOTE: HTML 파일에서 호출할 수 있는 함수를 전역으로 노출
window.openWebSocketConnections = openWebSocketConnections;
window.closeWebSocketConnections = closeWebSocketConnections;
window.subscribeRobotControlData = subscribeRobotControlData;
window.unsubscribeRobotControlData = unsubscribeRobotControlData;
window.publishRobotControlData = publishRobotControlData;
