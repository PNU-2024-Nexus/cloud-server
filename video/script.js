import dotenv from "dotenv";
dotenv.config();

const videoPubUrl = process.env.VIDEO_PUB_URL;
const videoSubUrl = process.env.VIDEO_SUB_URL;

/**
 * WebSocket 연결을 여는 함수
 */
function openVideoPubWebSocketConnections() {
  let videoPubSocket = new WebSocket(videoPubUrl);

  videoPubSocket.binaryType = "arraybuffer";

  return videoPubSocket;
}

function openVideoSubWebSocketConnections() {
  let videoSubSocket = new WebSocket(videoSubUrl);

  videoSubSocket.binaryType = "arraybuffer";

  return videoPubSocket;
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

async function publish() {
  const stream = await getVideoSrcObject();

  const websocket = openVideoPubWebSocketConnections();

  const codecs = "h264";
  const codecsValue = "avc1.42E03C";
  const videoWidth = "1280";
  const videoHeight = "720";
  const bitrate = "6000000";
  const framerate = "20";
  const bitrateMode = "constant";
  const latencyMode = "realtime";

  websocket.onopen = async function () {
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
    keepWebSocketAlive(websocket);
  };

  websocket.onclose = function () {
    console.log("websocket closed");
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

  while (websocket.OPEN) {
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
  makeResolutionOptions();
  checkCameraPermissionButton.addEventListener("click", checkCameraPermission);
  videoPublishButton.addEventListener("click", publish);
  videoUnpublishButton.addEventListener("click", unpublish);
});

// NOTE: HTML 파일에서 호출할 수 있는 함수를 전역으로 노출
window.openVideoPubWebSocketConnections = openVideoPubWebSocketConnections;
window.openVideoSubWebSocketConnections = openVideoSubWebSocketConnections;
window.closeWebSocketConnections = closeWebSocketConnections;
window.subscribeVideoData = subscribeVideoData;
window.unsubscribeVideoData = unsubscribeVideoData;
window.publishVideoData = publishVideoData;
