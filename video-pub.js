document
  .getElementById("checkCameraPermissionButton")
  .addEventListener("click", checkCameraPermission);
document.getElementById("publishButton").addEventListener("click", publish);

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

  // TODO: server URL
  const serverURL = "";

  const websocket = new WebSocket(serverURL);
  websocket.binaryType = "arraybuffer";

  const codecs = "";
  const codecsValue = "";
  const videoWidth = "";
  const videoHeight = "";
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
