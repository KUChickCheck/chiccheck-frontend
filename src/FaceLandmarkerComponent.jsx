import React, { useEffect, useRef, useState } from "react";
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

  // Start predictions at 30 FPS
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

        const noseTip = result.faceLandmarks[0][1]
        const leftCheek = result.faceLandmarks[0][234]
        const rightCheek = result.faceLandmarks[0][454]
        const Chin = result.faceLandmarks[0][152]
        const forehead = result.faceLandmarks[0][10]

        const depthNoseLeft = Math.abs(noseTip.z - leftCheek.z)
        const depthNoseRight = Math.abs(noseTip.z - rightCheek.z)

        // console.log("left: " + depthNoseLeft + ", z: " + leftCheek.z)
        // console.log("right: " +depthNoseRight + ", z: " + rightCheek.z)

        if (depthNoseLeft < 0.2 && depthNoseRight < 0.2) {
          setLiveness("Spoof")
        } else {
          setLiveness("Live")
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setLiveness("Face not found")
      }

    }, 0); // Approximately 30 FPS
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

