import { CONTROL_PUB_URL, CONTROL_SUB_URL } from "../env.js";

const robotControlPubUrl = CONTROL_PUB_URL;
const robotControlSubUrl = CONTROL_SUB_URL;

/**
 * 로봇 리스트
 */
const robotList = [
  { id: 1, name: "Robot Alpha" },
  { id: 2, name: "Robot Beta" },
  { id: 3, name: "Robot Gamma" },
];

/**
 * 로봇 리스트를 로드하여 select 요소에 추가하는 함수
 */
function loadRobotList() {
  const robotSelect = document.getElementById("robotSelect");
  robotList.forEach((robot) => {
    const option = document.createElement("option");
    option.value = robot.id;
    option.text = robot.name;
    robotSelect.appendChild(option);
  });
}

/**
 * 로봇을 제어하는 버튼 클릭 이벤트 핸들러
 */
function controlRobot() {
  const robotControlPubSocket = new WebSocket(robotControlPubUrl);
  const robotControlSubSocket = new WebSocket(robotControlSubUrl);

  const robotSelect = document.getElementById("robotSelect");
  const selectedRobotId = robotSelect.value;
  console.log("Selected Robot ID:", selectedRobotId);

  // TODO: 선택된 로봇을 제어하는 로직 추가
}

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

document.addEventListener("DOMContentLoaded", () => {
  loadRobotList();
  document
    .getElementById("controlButton")
    .addEventListener("click", controlRobot);
});
