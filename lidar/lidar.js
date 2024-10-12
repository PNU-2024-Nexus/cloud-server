/**
 * Unity 화면을 로드하는 함수
 */
function loadUnityScreen() {
  const lidarHostInput = document.getElementById("lidarServerInput");
  const unityIframe = document.getElementById("lidarDisplay");
  // const placeholderImage = document.getElementById("placeholderImage");

  const host = lidarHostInput.value.trim();
  if (host) {
    unityIframe.src = host;
    unityIframe.style.display = "block";
    // placeholderImage.style.display = "none";
  } else {
    alert("Please enter a valid host address.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const connectLidarServerButton =
    document.getElementById("connectLidarServer");
  connectLidarServerButton.addEventListener("click", loadUnityScreen);
});
