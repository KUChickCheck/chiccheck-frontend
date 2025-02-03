import React, { useEffect, useRef, useState } from "react";
import { writeCSVBrowser } from "../../utilities/writeCSV";
import * as tf from '@tensorflow/tfjs';
import { useSelector } from "react-redux";
// import axios from "axios";
import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { drawMesh } from "../../utilities/drawMesh";
import api from "../../utilities/api";
import Loading from "../../components/Loading";
import { useNavigate, useParams } from "react-router-dom";
import Swal from 'sweetalert2'

const FaceScan = () => {
  const { user } = useSelector((state) => state.auth);
  const { class_id } = useParams();
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
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)

  const navigate = useNavigate()

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
    if (faceLandmarker) {
      enableWebcam()
      setLoading(true)
    }
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
      // Ensure canvas matches video size after it has loaded
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const guideCanvas = guideCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      guideCanvas.width = video.videoWidth;
      guideCanvas.height = video.videoHeight;
      const guideCanvasCTX = guideCanvas.getContext("2d");
      startPrediction();


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

  let hasGenerated = false;

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

        if (insideOval && !hasGenerated) {
          markAttendance(faceLandmarks);
          hasGenerated = true; // Prevent further calls
        }

        // if (!insideOval) {
        //   hasGenerated = false;
        // }

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
        setLiveness("Face aligned");
        if (faceLandmarks.length > 0) {
          // handleCaptureAndPredict()

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

          // console.log("left: " + depthPairs.depth_leftcheek_to_nose)
          // console.log("right: " + depthPairs.depth_rightcheek_to_nose)

          // setData((prevData) => [...prevData, depthPairs]);
        }
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
    ctx.ellipse(width / 2, height / 2, ovalWidth, ovalHeight, 0, 0, 2 * Math.PI);
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

  const markAttendance = async (landmarks) => {
    if (!videoRef.current) {
      alert("Webcam not enabled");
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Compute bounding box (min/max points)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    landmarks.forEach((point) => {
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    // Add some padding around the face
    const padding = 40;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);
    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;

    // Create a new canvas for the cropped face
    const faceCanvas = document.createElement("canvas");
    faceCanvas.width = faceWidth;
    faceCanvas.height = faceHeight;
    const faceCtx = faceCanvas.getContext("2d");

    // Draw only the face on the new canvas
    faceCtx.drawImage(canvas, minX, minY, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);

    const base64Image = faceCanvas.toDataURL("image/png");

    try {
      setVerifyLoading(true)

      const response = await api.post('/attendance', {
        student_id: user._id,
        class_id: class_id,
        photo: base64Image
      })

      setVerifyLoading(false)

      if (response.message === "Attendance marked successfully") {
        Swal.fire({
          icon: "success",
          title: response.message,
          text: `Class: ${response.attendance.class_details.name} (${response.attendance.status})`,
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        Swal.fire({
          icon: "error",
          title: response.message,
          showConfirmButton: false,
          timer: 3000
        });
      }

      navigate("/")

    } catch (error) {
      setVerifyLoading(false)
      
      Swal.fire({
        icon: "error",
        title: error.response.data.message,
        showConfirmButton: false,
        timer: 3000
      });

      navigate("/")
    }
  };

  if (!loading) {
    return (<div className="w-full max-w-md mx-auto h-screen flex items-center justify-center"><Loading></Loading></div>)
  }

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

      {verifyLoading && (
        <div id="loading-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60">

          <svg class="animate-spin h-8 w-8 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>

          <span class="text-white text-3xl font-bold">FaceVerify...</span>

        </div>
      )}
    </div>
  );


};

export default FaceScan;

