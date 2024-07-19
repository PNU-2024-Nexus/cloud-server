const DOM_ELEMENTS = {
  serverInput: "serverInput",
  checkCameraPermissionButton: "checkCameraPermissionButton",
  cameraPermissionLabel: "cameraPermissionLabel",
  cameraSelect: "cameraSelect",
  videoElement: "videoElement",
  videoPublishButton: "videoPublishButton",
};

export function initializeDOMElements() {
  return Object.keys(DOM_ELEMENTS).reduce((elements, key) => {
    elements[key] = document.getElementById(DOM_ELEMENTS[key]);
    return elements;
  }, {});
}
