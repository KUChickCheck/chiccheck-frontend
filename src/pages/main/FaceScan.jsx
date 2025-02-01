import React, { useEffect, useRef, useState } from "react";
import { writeCSVBrowser } from "../../utilities/writeCSV";
import * as tf from '@tensorflow/tfjs';
// import axios from "axios";
import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { drawMesh } from "../../utilities/drawMesh";
import api from "../../utilities/api";

const FaceScan = () => {
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [liveness, setLiveness] = useState("Face not found");
  const videoRef = useRef(null);
  const liveViewRef = useRef(null);
  const intervalRef = useRef(null);
  const intervalLivenessRef = useRef(null);
  const canvasRef = useRef(null);
  const guideCanvasRef = useRef(null);
  const [data, setData] = useState([])
  const [depth1, setDepth1] = useState("")
  const [depth2, setDepth2] = useState("")
  const [model, setModel] = useState(null);
  const [confidence, setConfidence] = useState("")
  const [faceInside, setFaceInside] = useState(false)

  const loadModel = async () => {
    try {
      const loadedModel = await tf.loadGraphModel('graph_model/model.json');
      console.log(loadModel)
      setModel(loadedModel);
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  const preprocessImage = (imageElement, targetSize = [150, 150]) => {
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor(targetSize) // Resize the image
      .toFloat() // Convert the image to float
      .div(tf.scalar(255)) // Normalize the image
      .expandDims(0); // Add batch dimension

    return tensor;
  };

  useEffect(() => {
    loadModel();

    // Clean up interval on component unmount
    return () => {
      if (intervalLivenessRef.current) clearInterval(intervalLivenessRef.current);
    };
  }, []);

  // Initialize the face landmarker
  useEffect(() => {
    const initializeFaceLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
      });
      setFaceLandmarker(landmarker);

    };

    initializeFaceLandmarker();



    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    enableWebcam()
  }, [faceLandmarker]);

  // Enable webcam and start detection
  const enableWebcam = async () => {
    if (!faceLandmarker) {
      alert("Face Landmarker is still loading. Please try again.");
      return;
    }

    const constraints = { video: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoRef.current.srcObject = stream;

    videoRef.current.onloadeddata = () => {
      startPrediction();
      // Ensure canvas matches video size after it has loaded
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const guideCanvas = guideCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      guideCanvas.width = video.videoWidth;
      guideCanvas.height = video.videoHeight;

      const guideCanvasCTX = guideCanvas.getContext("2d");


      // const mouthY = (guideCanvas.height / 3) * 2
      // const mouthX = (guideCanvas.width / 2)

      // const eyeLeftY = (guideCanvas.height / 2) - 20
      // const eyeLeftX = (guideCanvas.width / 2) + 60

      // const eyeRightY = (guideCanvas.height / 2) - 20
      // const eyeRightX = (guideCanvas.width / 2) - 60

      // guideCanvasCTX.fillStyle = "red";
      // // Draw mouth guide
      // guideCanvasCTX.beginPath();
      // guideCanvasCTX.arc(mouthX, mouthY, 5, 0, 2 * Math.PI);
      // guideCanvasCTX.fill();

      // // Draw left eye guide
      // guideCanvasCTX.beginPath();
      // guideCanvasCTX.arc(eyeLeftX, eyeLeftY, 5, 0, 2 * Math.PI);
      // guideCanvasCTX.fill();

      // // Draw right eye guide
      // guideCanvasCTX.beginPath();
      // guideCanvasCTX.arc(eyeRightX, eyeRightY, 5, 0, 2 * Math.PI);
      // guideCanvasCTX.fill();

    };
  };

  const startPrediction = () => {
    if (!faceLandmarker || !videoRef.current) return;

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const currentTime = performance.now();

      const result = faceLandmarker.detectForVideo(video, currentTime);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const guideCanvas = guideCanvasRef.current;

      const guideCanvasCTX = guideCanvas.getContext("2d");
      guideCanvasCTX.clearRect(0, 0, guideCanvas.width, guideCanvas.height);

      drawOval(guideCanvasCTX, guideCanvas.width, guideCanvas.height, false)

      if (result.faceLandmarks.length !== 0) {
        requestAnimationFrame(() => {
          drawMesh(result.faceLandmarks, ctx, canvas);
        });

        const faceLandmarks = result.faceLandmarks[0];

        // Suggested Keypoints
        const keypoints = {
          nose: faceLandmarks[1],
          left_eye: faceLandmarks[468],
          right_eye: faceLandmarks[473],
          left_cheek: faceLandmarks[234],
          right_cheek: faceLandmarks[454],
          chin: faceLandmarks[152],
          forehead: faceLandmarks[10],
        };

        // Calculate Depth Pairs
        const depthPairs = {
          depth_leftcheek_to_nose: Math.abs(keypoints.left_cheek.z - keypoints.nose.z),
          depth_rightcheek_to_nose: Math.abs(keypoints.right_cheek.z - keypoints.nose.z),
          depth_lefteye_to_nose: Math.abs(keypoints.left_eye.z - keypoints.nose.z),
          depth_righteye_to_nose: Math.abs(keypoints.right_eye.z - keypoints.nose.z),
          depth_leftcheek_to_chin: Math.abs(keypoints.left_cheek.z - keypoints.chin.z),
          depth_rightcheek_to_chin: Math.abs(keypoints.right_cheek.z - keypoints.chin.z),
          depth_forehead_to_nose: Math.abs(keypoints.forehead.z - keypoints.nose.z),
        };

        setDepth1(depthPairs.depth_leftcheek_to_nose)
        setDepth2(depthPairs.depth_rightcheek_to_nose)

        // // Guide dot coordinates
        
        
        const insideOval = isFaceInsideOval(faceLandmarks, guideCanvas.width, guideCanvas.height);
        drawOval(guideCanvasCTX, guideCanvas.width, guideCanvas.height, insideOval);
        
        // const mouthY = (guideCanvas.height / 3) * 2;
        // const mouthX = guideCanvas.width / 2;

        // const eyeLeftY = (guideCanvas.height / 2) - 20;
        // const eyeLeftX = (guideCanvas.width / 2) + 60;

        // const eyeRightY = (guideCanvas.height / 2) - 20;
        // const eyeRightX = (guideCanvas.width / 2) - 60;

        // // Get relevant face landmarks
        // const noseTip = faceLandmarks[1];
        // const rightEye = faceLandmarks[468]; // Adjust based on landmark index for left eye
        // const leftEye = faceLandmarks[473]; // Adjust based on landmark index for right eye
        // const mouthCenter = faceLandmarks[13]; // Adjust based on landmark index for mouth center

        // // Calculate distances between landmarks and guide dots
        // const distanceMouth = Math.sqrt(
        //   Math.pow(mouthX - mouthCenter.x * guideCanvas.width, 2) + Math.pow(mouthY - mouthCenter.y * guideCanvas.height, 2)
        // );

        // const distanceLeftEye = Math.sqrt(
        //   Math.pow(eyeLeftX - leftEye.x * guideCanvas.width, 2) + Math.pow(eyeLeftY - leftEye.y * guideCanvas.height, 2)
        // );

        // const distanceRightEye = Math.sqrt(
        //   Math.pow(eyeRightX - rightEye.x * guideCanvas.width, 2) + Math.pow(eyeRightY - rightEye.y * guideCanvas.height, 2)
        // );

        // // Define thresholds (adjust based on your testing)
        // const alignmentThreshold = 20; // Pixels

        handleCaptureAndPredict()
        // Check if the face is aligned
        // if (
        //   distanceMouth < alignmentThreshold &&
        //   distanceLeftEye < alignmentThreshold &&
        //   distanceRightEye < alignmentThreshold
        // ) {
        //   setLiveness("Face aligned");
        //   if (faceLandmarks.length > 0) {
        //     // handleCaptureAndPredict()

        //     // // Suggested Keypoints
        //     // const keypoints = {
        //     //   nose: faceLandmarks[1],
        //     //   left_eye: faceLandmarks[468],
        //     //   right_eye: faceLandmarks[473],
        //     //   left_cheek: faceLandmarks[234],
        //     //   right_cheek: faceLandmarks[454],
        //     //   chin: faceLandmarks[152],
        //     //   forehead: faceLandmarks[10],
        //     // };

        //     // // Calculate Depth Pairs
        //     // const depthPairs = {
        //     //   depth_leftcheek_to_nose: Math.abs(keypoints.left_cheek.z - keypoints.nose.z),
        //     //   depth_rightcheek_to_nose: Math.abs(keypoints.right_cheek.z - keypoints.nose.z),
        //     //   depth_lefteye_to_nose: Math.abs(keypoints.left_eye.z - keypoints.nose.z),
        //     //   depth_righteye_to_nose: Math.abs(keypoints.right_eye.z - keypoints.nose.z),
        //     //   depth_leftcheek_to_chin: Math.abs(keypoints.left_cheek.z - keypoints.chin.z),
        //     //   depth_rightcheek_to_chin: Math.abs(keypoints.right_cheek.z - keypoints.chin.z),
        //     //   depth_forehead_to_nose: Math.abs(keypoints.forehead.z - keypoints.nose.z),
        //     // };

        //     // setDepth1(depthPairs.depth_leftcheek_to_nose)
        //     // setDepth2(depthPairs.depth_rightcheek_to_nose)

        //     // console.log("left: " + depthPairs.depth_leftcheek_to_nose)
        //     // console.log("right: " + depthPairs.depth_rightcheek_to_nose)

        //     // setData((prevData) => [...prevData, depthPairs]);
        //   }
        // } else {
        //   setLiveness("Face misaligned");
        // }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        guideCanvasCTX.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
        setLiveness("Face not found");
      }
    }, 0);
  };

  const handleCaptureAndPredict = () => {
    // if (!model || !videoRef.current) return;

    //   const video = videoRef.current;
    //   const canvas = document.createElement("canvas");
    //   canvas.width = video.videoWidth;
    //   canvas.height = video.videoHeight;

    //   const ctx = canvas.getContext("2d");
    //   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    //   // Preprocess the image and make prediction
    //   const inputTensor = preprocessImage(canvas, [224, 224]);

    //   // Use model.execute() for Graph model predictions (no control flow required)
    //   const predictionResult = model.execute(inputTensor);

    //   // Assuming the model output is a single value or tensor of predictions
    //   const prediction = predictionResult.dataSync()[0]; // Modify if you have a different output structure

    //   setConfidence(prediction > 0.7 ? "Spoof": "Live");

    //   // Dispose tensors after use to prevent memory leaks
    //   predictionResult.dispose();
    //   inputTensor.dispose();
  };

  const drawOval = (ctx, width, height, isInside) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Dark background with transparency
    ctx.fillRect(0, 0, width, height); // Fill entire canvas

    ctx.globalCompositeOperation = "destination-out";
  
    // Use the smaller dimension to keep proportions the same
    const minSize = Math.min(width, height);
    const ovalWidth = minSize * 0.25;  // 40% of minSize (narrower)
    const ovalHeight = minSize * 0.35; // 70% of minSize (taller)
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2,ovalWidth, ovalHeight, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Reset globalCompositeOperation for normal drawing
    ctx.globalCompositeOperation = "source-over"; 
    ctx.strokeStyle = isInside ? "green" : "red"; 
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, ovalWidth, ovalHeight, 0, 0, 2 * Math.PI);
    ctx.stroke();
};


  const isFaceInsideOval = (landmarks, width, height) => {
    const ovalX = width / 2;
    const ovalY = height / 2;
    const minSize = Math.min(width, height);
    const ovalWidth = minSize * 0.25;  // 40% of minSize (narrower)
    const ovalHeight = minSize * 0.35; // 70% of minSize (taller)
    // const ovalWidth = width / 4;
    // const ovalHeight = height / 3;
  
    // Select 5 key points from MediaPipe FaceLandmarker
    const top = landmarks[10];   // Forehead
    const bottom = landmarks[152]; // Chin
    const left = landmarks[234];   // Left cheek
    const right = landmarks[454];  // Right cheek
    const middle = landmarks[2];   // Nose tip
  
    return (
      isPointInsideOval(top.x * width, top.y * height, ovalX, ovalY, ovalWidth, ovalHeight) &&
      isPointInsideOval(bottom.x * width, bottom.y * height, ovalX, ovalY, ovalWidth, ovalHeight) &&
      isPointInsideOval(left.x * width, left.y * height, ovalX, ovalY, ovalWidth, ovalHeight) &&
      isPointInsideOval(right.x * width, right.y * height, ovalX, ovalY, ovalWidth, ovalHeight) &&
      isPointInsideOval(middle.x * width, middle.y * height, ovalX, ovalY, ovalWidth, ovalHeight)
    );
  };
  
  const isPointInsideOval = (px, py, cx, cy, rw, rh) => {
    const dx = (px - cx) / rw;
    const dy = (py - cy) / rh;
    return dx * dx + dy * dy <= 1;
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col items-center justify-center px-4 box-border">
      {/* <h1 className="text-3xl font-bold underline text-center sm:text-xl">{liveness}</h1> */}
      {/* Webcam Detection */}
      {/* <p>{Number(depth1).toFixed(4)}</p>
      <p>{Number(depth2).toFixed(4)}</p> */}
      <p>{confidence}</p>
      <div
        id="liveView"
        ref={liveViewRef}
        className="relative w-full max-w-xs h-auto overflow-hidden"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto relative z-10 transform -scale-x-100"
        ></video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-20 transform -scale-x-100"
        ></canvas>
        <canvas
          ref={guideCanvasRef}
          className="absolute top-0 left-0 w-full h-full z-30 transform -scale-x-100"
        ></canvas>
      </div>
    </div>
  );


};

export default FaceScan;

