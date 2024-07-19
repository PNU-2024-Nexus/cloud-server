import { VIDEO_PUB_URL } from "../env.js";

const videoPubUrl = VIDEO_PUB_URL;
let videoPubSocket;

/**
 * WebSocket 연결을 여는 함수
 */
function openVideoPubWebSocketConnections() {
  videoPubSocket = new WebSocket(videoPubUrl);
  videoPubSocket.binaryType = "arraybuffer";

  videoPubSocket.onclose = function () {
    console.log("WebSocket connection closed.");
  };

  videoPubSocket.onerror = function (error) {
    console.error("WebSocket error:", error);
  };

  return videoPubSocket;
}

/**
 * WebSocket 연결을 닫는 함수
 */
function closeWebSocketConnections() {
  if (videoPubSocket) {
    videoPubSocket.close();
    videoPubSocket = null;
  }
}

/**
 * 카메라 권한을 확인하는 함수
 */
async function checkCameraPermission() {
  try {
    const result = await navigator.permissions.query({ name: "camera" });
    document.getElementById("cameraPermissionLabel").innerHTML = result.state;

    if (result.state === "prompt") {
      try {
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        document.getElementById("cameraPermissionLabel").innerHTML =
          result.state;
        console.log("Camera access granted.");
      } catch (error) {
        console.error("Camera access denied.");
      }
    }
    await findCameraDevice();
  } catch (error) {
    console.error("Error checking camera permission:", error);
  }
}

async function findCameraDevice() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device) => {
      if (device.kind === "videoinput") {
        updateCameraSelection(device);
      }
    });
  } catch (err) {
    console.error(err.name + ": " + err.message);
  }
}

function updateCameraSelection(device) {
  const option = document.createElement("option");
  option.value = device.deviceId;
  option.text = device.label;
  document.getElementById("cameraSelect").appendChild(option);
}

async function getVideoSrcObject() {
  const cameraId = document.getElementById("cameraSelect").value;
  const constraints = {
    audio: false,
    video: {
      deviceId: cameraId,
    },
  };

  const stream = await navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      document.getElementById("videoElement").srcObject = stream;
      document.getElementById("videoElement").style.display = "block";
      document.getElementById("videoPreview").style.display = "none";
      return stream;
    })
    .catch((error) => {
      console.error(error);
    });

  return stream;
}

/**
 * 카메라 선택 시 스트림을 표시하는 함수
 */
async function handleCameraSelectionChange() {
  await getVideoSrcObject();
}

async function publish() {
  const stream = await getVideoSrcObject();
  videoPubSocket = openVideoPubWebSocketConnections();

  const codecs = "h264";
  const codecsValue = "avc1.42E03C";
  const videoWidth = "1280";
  const videoHeight = "720";
  const bitrate = "6000000";
  const framerate = "20";
  const bitrateMode = "constant";
  const latencyMode = "realtime";

  videoPubSocket.onopen = async function () {
    const mime = `video/${codecs};codecs=${codecsValue};width=${videoWidth};height=${videoHeight};`;
    websocket.send(mime);

    function handleVideoChunk(chunk) {
      const chunkData = new Uint8Array(chunk.byteLength);
      chunk.copyTo(chunkData);
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(chunkData);
      }
    }

    const videoEncoderConfig = {
      codec: codecsValue,
      width: videoWidth,
      height: videoHeight,
      bitrate,
      framerate,
      bitrateMode,
      latencyMode,
      avc: { format: "annexb" },
    };

    await encode(stream, videoEncoderConfig, handleVideoChunk);
  };
}

async function encode(
  stream,
  videoEncoderConfig,
  handleChunk,
  keyFrameInterval = 1
) {
  const videoTrack = stream.getVideoTracks()[0];
  const trackProcessor = new MediaStreamTrackProcessor(videoTrack);
  const reader = trackProcessor.readable.getReader();
  let frameCounter = 0;

  if (!(await VideoEncoder.isConfigSupported(videoEncoderConfig))) {
    console.error("Unsupported video encoder configuration.");
    return;
  }

  const videoEncoder = new VideoEncoder({
    output: handleChunk,
    error: (err) => {
      console.error(err);
    },
  });

  videoEncoder.configure(videoEncoderConfig);

  while (videoPubSocket.readyState === WebSocket.OPEN) {
    const { done, value } = await reader.read();

    if (done) return;
    if (videoEncoder === null || videoEncoder.state === "closed") {
      value.close();
      return;
    }

    frameCounter++;

    videoEncoder.encode(value, {
      keyFrame: frameCounter % keyFrameInterval === 0,
    });

    value.close();
  }
}

async function unpublish() {
  const stream = document.getElementById("videoElement").srcObject;
  const videoTrack = stream.getVideoTracks()[0];
  videoTrack.stop();

  closeWebSocketConnections();
}

document.addEventListener("DOMContentLoaded", () => {
  checkCameraPermissionButton.addEventListener("click", checkCameraPermission);
  videoPublishButton.addEventListener("click", publish);
  videoUnpublishButton.addEventListener("click", unpublish);
  document
    .getElementById("cameraSelect")
    .addEventListener("change", handleCameraSelectionChange);
});
