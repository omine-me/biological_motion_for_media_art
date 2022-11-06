const controls = window;
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
// const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
// const grid = new LandmarkGrid(landmarkContainer);
let isVideoOn = true;
let areConnectorsVisible = false;
let selectedLandmarks = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]

function toggleVideo() {
    isVideoOn = !isVideoOn;
}

function toggleConnector() {
    areConnectorsVisible = !areConnectorsVisible;
}
function toggleLandmark(idx){
    if (selectedLandmarks.includes(idx)){
        selectedLandmarks = selectedLandmarks.filter(elem => elem != idx)
    }else{
        selectedLandmarks.push(idx)
    }
    
}

function onResults(results) {
//   if (!results.poseLandmarks) {
//     grid.updateLandmarks([]);
//     return;
//   }

  // we use only these landmarks: 0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28
  // https://google.github.io/mediapipe/solutions/pose.html#pose-landmark-model-blazepose-ghum-3d

  canvasCtx.save();
  canvasCtx.fillStyle = '#000000';
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite existing pixels.
  // 背景色
  canvasCtx.globalCompositeOperation = 'source-over';
  canvasCtx.fillStyle = '#000000';
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite missing pixels.
  // カメラ画像
  if (isVideoOn){
    canvasCtx.globalCompositeOperation = 'source-over';
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  
  if (results.poseLandmarks){
  results.poseLandmarks.forEach((lm, idx) => {
    if (!selectedLandmarks.includes(idx)){
        results.poseLandmarks[idx] = {x: -10., y: -10., z: -0, visibility: 0.}
    }
  }
  )}
  
    canvasCtx.globalCompositeOperation = 'source-over';
  if (areConnectorsVisible){
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#0000FF', lineWidth: 3});  
  }
//   results.poseLandmarks
  drawLandmarks(canvasCtx, results.poseLandmarks,
                {color: '#FFF', lineWidth: 5});
  canvasCtx.restore();

//   grid.updateLandmarks(results.poseWorldLandmarks);
}

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();


new controls
    .ControlPanel(controlsElement, {
    selfieMode: false,
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    effect: 'background',
})
    .add([
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            // Resets because this model gives better results when reset between
            // source changes.
            pose.reset();
        },
//         onFrame: async (input, size) => {
//             const aspect = size.height / size.width;
//             let width, height;
//             if (window.innerWidth > window.innerHeight) {
//                 height = window.innerHeight;
//                 width = height / aspect;
//             }
//             else {
//                 width = window.innerWidth;
//                 height = width * aspect;
//             }
//             canvasElement.width = width;
//             canvasElement.height = height;
//             await pose.send({ image: input });
//         },
    }),
    new controls.Slider({
        title: 'Model Complexity',
        field: 'modelComplexity',
        discrete: ['Lite', 'Full', 'Heavy'],
    }),
    new controls.Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    activeEffect = x['effect'];
    pose.setOptions(options);
});
