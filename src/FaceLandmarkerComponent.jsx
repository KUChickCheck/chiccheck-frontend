import React, { useEffect, useRef, useState } from "react";
import { writeCSVBrowser } from "./writeCSV";
// import axios from "axios";
import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { drawMesh } from "./utilities";

const FaceLandmarkDetection = () => {
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [liveness, setLiveness] = useState("Face not found");
  const videoRef = useRef(null);
  const liveViewRef = useRef(null);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);
  const guideCanvasRef = useRef(null);
  const [data, setData] = useState([])
  const [depth1, setDepth1] = useState("")
  const [depth2, setDepth2] = useState("")

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

      const mouthY = (guideCanvas.height / 3) * 2
      const mouthX = (guideCanvas.width / 2)

      const eyeLeftY = (guideCanvas.height / 2) - 20
      const eyeLeftX = (guideCanvas.width / 2) + 60

      const eyeRightY = (guideCanvas.height / 2) - 20
      const eyeRightX = (guideCanvas.width / 2) - 60

      guideCanvasCTX.fillStyle = "red";
      // Draw mouth guide
      guideCanvasCTX.beginPath();
      guideCanvasCTX.arc(mouthX, mouthY, 5, 0, 2 * Math.PI);
      guideCanvasCTX.fill();

      // Draw left eye guide
      guideCanvasCTX.beginPath();
      guideCanvasCTX.arc(eyeLeftX, eyeLeftY, 5, 0, 2 * Math.PI);
      guideCanvasCTX.fill();

      // Draw right eye guide
      guideCanvasCTX.beginPath();
      guideCanvasCTX.arc(eyeRightX, eyeRightY, 5, 0, 2 * Math.PI);
      guideCanvasCTX.fill();

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

        // Guide dot coordinates
        const guideCanvas = guideCanvasRef.current;
        const mouthY = (guideCanvas.height / 3) * 2;
        const mouthX = guideCanvas.width / 2;

        const eyeLeftY = (guideCanvas.height / 2) - 20;
        const eyeLeftX = (guideCanvas.width / 2) + 60;

        const eyeRightY = (guideCanvas.height / 2) - 20;
        const eyeRightX = (guideCanvas.width / 2) - 60;

        // Get relevant face landmarks
        const noseTip = faceLandmarks[1];
        const rightEye = faceLandmarks[468]; // Adjust based on landmark index for left eye
        const leftEye = faceLandmarks[473]; // Adjust based on landmark index for right eye
        const mouthCenter = faceLandmarks[13]; // Adjust based on landmark index for mouth center

        // Calculate distances between landmarks and guide dots
        const distanceMouth = Math.sqrt(
          Math.pow(mouthX - mouthCenter.x * guideCanvas.width, 2) + Math.pow(mouthY - mouthCenter.y * guideCanvas.height, 2)
        );

        const distanceLeftEye = Math.sqrt(
          Math.pow(eyeLeftX - leftEye.x * guideCanvas.width, 2) + Math.pow(eyeLeftY - leftEye.y * guideCanvas.height, 2)
        );

        const distanceRightEye = Math.sqrt(
          Math.pow(eyeRightX - rightEye.x * guideCanvas.width, 2) + Math.pow(eyeRightY - rightEye.y * guideCanvas.height, 2)
        );

        // Define thresholds (adjust based on your testing)
        const alignmentThreshold = 20; // Pixels

        // Check if the face is aligned
        if (
          distanceMouth < alignmentThreshold &&
          distanceLeftEye < alignmentThreshold &&
          distanceRightEye < alignmentThreshold
        ) {
          setLiveness("Face aligned");
          if (faceLandmarks.length > 0) {

            // // Suggested Keypoints
            // const keypoints = {
            //   nose: faceLandmarks[1],
            //   left_eye: faceLandmarks[468],
            //   right_eye: faceLandmarks[473],
            //   left_cheek: faceLandmarks[234],
            //   right_cheek: faceLandmarks[454],
            //   chin: faceLandmarks[152],
            //   forehead: faceLandmarks[10],
            // };

            // // Calculate Depth Pairs
            // const depthPairs = {
            //   depth_leftcheek_to_nose: Math.abs(keypoints.left_cheek.z - keypoints.nose.z),
            //   depth_rightcheek_to_nose: Math.abs(keypoints.right_cheek.z - keypoints.nose.z),
            //   depth_lefteye_to_nose: Math.abs(keypoints.left_eye.z - keypoints.nose.z),
            //   depth_righteye_to_nose: Math.abs(keypoints.right_eye.z - keypoints.nose.z),
            //   depth_leftcheek_to_chin: Math.abs(keypoints.left_cheek.z - keypoints.chin.z),
            //   depth_rightcheek_to_chin: Math.abs(keypoints.right_cheek.z - keypoints.chin.z),
            //   depth_forehead_to_nose: Math.abs(keypoints.forehead.z - keypoints.nose.z),
            // };

            // setDepth1(depthPairs.depth_leftcheek_to_nose)
            // setDepth2(depthPairs.depth_rightcheek_to_nose)

            // console.log("left: " + depthPairs.depth_leftcheek_to_nose)
            // console.log("right: " + depthPairs.depth_rightcheek_to_nose)

            // setData((prevData) => [...prevData, depthPairs]);
          }
        } else {
          setLiveness("Face misaligned");
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setLiveness("Face not found");
      }
    }, 0);
  };


  const handleExportCSV = () => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }
    writeCSVBrowser(data, "depths.csv");
  };


  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "10px", // Add padding for smaller screens
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", textAlign: "center" }}>{liveness}</h1>
      {/* Webcam Detection */}
      <p>{Number(depth1).toFixed(4)}</p>
      <p>{Number(depth2).toFixed(4)}</p>

      <button
        onClick={enableWebcam}
        style={{
          marginBottom: "10px",
          padding: "10px 20px",
          fontSize: "1rem",
          borderRadius: "5px",
          backgroundColor: "#007BFF",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Enable Webcam
      </button>
      <button
        onClick={handleExportCSV}
        style={{
          marginBottom: "10px",
          padding: "10px 20px",
          fontSize: "1rem",
          borderRadius: "5px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Export CSV
      </button>
      <div
        id="liveView"
        ref={liveViewRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px", // Limit width for mobile
          height: "auto",
          overflow: "hidden",
          // borderRadius: "10px", // Optional for rounded corners
          // boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Optional for better visuals
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "auto",
            position: "relative",
            zIndex: 1,
            transform: "scaleX(-1)", // Flip the video horizontally
          }}
        ></video>
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 2,
            transform: "scaleX(-1)", // Mirror the canvas
          }}
        ></canvas>
        <canvas
          ref={guideCanvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 3, // Higher z-index for guide canvas
            transform: "scaleX(-1)", // Mirror the canvas
          }}
        ></canvas>
      </div>
    </div>
  );

};

export default FaceLandmarkDetection;

