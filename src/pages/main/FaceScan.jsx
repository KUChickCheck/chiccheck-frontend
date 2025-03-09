import React, { useEffect, useRef, useState } from "react";
import { writeCSVBrowser } from "../../utilities/writeCSV";
import * as tf from "@tensorflow/tfjs";
import { useSelector } from "react-redux";
import {
  SquareArrowUp,
  SquareArrowDown,
  SquareArrowLeft,
  SquareArrowRight,
  SquareArrowUpLeft,
  SquareArrowUpRight,
  SquareArrowDownLeft,
  SquareArrowDownRight,
  ScanFace
} from "lucide-react";

import axios from "axios";
import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { drawMesh } from "../../utilities/drawMesh";
import api from "../../utilities/api";
import Loading from "../../components/Loading";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
// import LinearProgress from '@mui/material/LinearProgress';

// Map directions to Lucide icons
const directionIcons = {
  "Up": SquareArrowUp,
  "Down": SquareArrowDown,
  "Left": SquareArrowLeft,
  "Right": SquareArrowRight,
  "Up-Left": SquareArrowUpLeft,
  "Up-Right": SquareArrowUpRight,
  "Down-Left": SquareArrowDownLeft,
  "Down-Right": SquareArrowDownRight,
  "Center": ScanFace
};

const instructions = {
  "Left": "Turn your head left",
  "Right": "Turn your head right",
  "Up": "Look up",
  "Down": "Look down",
  "Up-Left": "Look up and left",
  "Up-Right": "Look up and right",
  "Down-Left": "Look down and left",
  "Down-Right": "Look down and right",
  "Center": "Keep your head straight"
};


const DirectionDisplay = ({ direction }) => {
  const IconComponent = directionIcons[direction];
  return IconComponent ? <IconComponent size={24} /> : null;
};

const directionsList = ["Left", "Right", "Up", "Down", "Up-Left", "Up-Right", "Down-Left", "Down-Right"];

const getRandomDirections = () => {
  let shuffled = [...directionsList].sort(() => Math.random() - 0.5); // Shuffle the array
  // let randomDirections = shuffled.slice(0, 1); // Get 4 random directions
  let randomDirections = []
  randomDirections.push("Center"); // Add "Back to Center" to the end
  return randomDirections;
};

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
  const [data, setData] = useState([]);
  const [depth1, setDepth1] = useState("");
  const [depth2, setDepth2] = useState("");
  const [model, setModel] = useState(null);
  const [confidence, setConfidence] = useState("");
  const [faceInside, setFaceInside] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [realFrames, setRealFrames] = useState(0);

  const [headDirection, setHeadDirection] = useState("");
  const [requiredDirections, setRequiredDirections] = useState(getRandomDirections());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const [marks, setMarks] = useState([])

  const [predictionResults, setPredictionResults] = useState([]);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);

  const streamRef = useRef(null); // Store stream in useRef

  const navigate = useNavigate();

  const [location, setLocation] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          alert(`Error getting location: ${error.message}`); // Show alert if user denies
        }
      );
    } else {
      const errorMsg = "Geolocation is not supported by this browser.";
      alert(errorMsg);
    }
  }, []);

  useEffect(() => {
    if (!isHolding && headDirection === requiredDirections[currentIndex]) {
      setIsHolding(true);
      setProgress(0);

      let progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 6, 100)); // Increase by ~1.67 every 16.67ms (60 FPS)
      }, 50);

      const timeout = setTimeout(() => {
        if (headDirection === requiredDirections[currentIndex]) {
          if (currentIndex < requiredDirections.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            sendImageToPredictApi()
            // handleCaptureAndPredict()
          } else {
            if (isAttendanceMarked) {
              markAttendance(marks);
            } else {
              Swal.fire({
                icon: "error",
                title: "You are fake!!",
                showConfirmButton: false,
                timer: 3000,
              });
              stopWebcam();
              navigate("/");
            }
            setCurrentIndex(0);
            setRequiredDirections(getRandomDirections());
          }
        }
        setIsHolding(false);
        setProgress(0);
        clearInterval(progressInterval);
      }, 2000);

      return () => {
        clearTimeout(timeout);
        clearInterval(progressInterval);
        setProgress(0);
      };
    }

    // Reset progress if the user moves before 500ms
    if (isHolding && headDirection !== requiredDirections[currentIndex]) {
      setIsHolding(false);
      setProgress(0);
    }

  }, [headDirection]);

  // const loadModel = async () => {
  //   try {
  //     const loadedModel = await tf.loadGraphModel("/liveness_model_graph/model.json");
  //     setModel(loadedModel);
  //     console.log("Model loaded successfully");
  //   } catch (error) {
  //     console.error("Error loading model:", error);
  //   }
  // };

  const preprocessImage = (imageElement, targetSize = [150, 150]) => {
    const tensor = tf.browser
      .fromPixels(imageElement)
      .resizeNearestNeighbor(targetSize) // Resize the image
      .toFloat() // Convert the image to float
      .div(tf.scalar(255)) // Normalize the image
      .expandDims(0); // Add batch dimension

    return tensor;
  };

  // useEffect(() => {
  //   loadModel();

  //   // Clean up interval on component unmount
  //   return () => {
  //     if (intervalLivenessRef.current)
  //       clearInterval(intervalLivenessRef.current);
  //   };
  // }, []);

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
      enableWebcam();
      setLoading(true);
    }
  }, [faceLandmarker]);


  // Stop the webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null; // Reset the streamRef after stopping
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => stopWebcam();

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopWebcam();
    };
  }, []);

  // Enable webcam and start detection
  const enableWebcam = async () => {
    if (!faceLandmarker) {
      alert("Face Landmarker is still loading. Please try again.");
      return;
    }

    try {
      const constraints = { video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream; // Store the stream in streamRef
      videoRef.current.srcObject = stream; // Set the video source object
    } catch (error) {
      if (error.name === "NotAllowedError") {
        alert("Permission denied: Please allow webcam access.");
      } else if (error.name === "NotFoundError") {
        alert("No webcam found. Please connect a camera.");
      } else if (error.name === "NotReadableError") {
        alert("Webcam is being used by another application.");
      } else {
        alert("An error occurred: " + error.message);
      }
      stopWebcam();
      navigate("/");
    }

    videoRef.current.onloadeddata = () => {
      // Ensure canvas matches video size after it has loaded
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const guideCanvas = guideCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      guideCanvas.width = video.videoWidth;
      guideCanvas.height = video.videoHeight;
      startPrediction();
    };
  };

  let hasGenerated = false;

  const startPrediction = () => {
    if (!faceLandmarker || !videoRef.current) return;

    let totalFrames = 0;
    const duration = 3000;
    let startTime = null;
    let isTracking = false;

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const currentTime = performance.now();

      const result = faceLandmarker.detectForVideo(video, currentTime);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const guideCanvas = guideCanvasRef.current;

      const guideCanvasCTX = guideCanvas.getContext("2d");
      guideCanvasCTX.clearRect(0, 0, guideCanvas.width, guideCanvas.height);

      drawOval(guideCanvasCTX, guideCanvas.width, guideCanvas.height, false);

      if (result.faceLandmarks.length !== 0) {
        requestAnimationFrame(() => {
          drawMesh(result.faceLandmarks, ctx, canvas);
        });

        const faceLandmarks = result.faceLandmarks[0];
        setMarks(faceLandmarks)

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

        // // Guide dot coordinates

        guideCanvasCTX.clearRect(0, 0, guideCanvas.width, guideCanvas.height);

        const insideOval = isFaceInsideOval(
          faceLandmarks,
          guideCanvas.width,
          guideCanvas.height
        );
        setFaceInside(insideOval);

        drawOval(
          guideCanvasCTX,
          guideCanvas.width,
          guideCanvas.height,
          insideOval,
        );

        const leftCheek = faceLandmarks[234];
        const rightCheek = faceLandmarks[454];
        const chin = faceLandmarks[152];
        const forehead = faceLandmarks[10];

        // Calculate yaw (left-right head rotation) using Z-axis
        const dz = rightCheek.z - leftCheek.z; // Depth difference
        const dx = rightCheek.x - leftCheek.x; // Horizontal difference
        const yaw = Math.atan2(dz, dx) * (180 / Math.PI); // Yaw angle in degrees

        // Calculate pitch (up-down head movement)
        const dy_pitch = chin.y - forehead.y;
        const dz_pitch = chin.z - forehead.z;
        const pitch = Math.atan2(dz_pitch, dy_pitch) * (180 / Math.PI);

        let direction = "Center";

        // Determine head turning (yaw using Z-axis)
        if (dz > 0.04) direction = "Left"; // Right cheek moves deeper (Z increases)
        if (dz < -0.04) direction = "Right"; // Left cheek moves deeper (Z increases)

        // Determine head movement up/down
        if (pitch > 10) direction = "Down";
        if (pitch < -10) direction = "Up";

        // Handle combined movements
        if (dz > 0.04 && pitch < -10) direction = "Up-Left";
        if (dz < -0.04 && pitch < -10) direction = "Up-Right";
        if (dz > 0.04 && pitch > 10) direction = "Down-Left";
        if (dz < -0.04 && pitch > 10) direction = "Down-Right";

        if (insideOval) {
          setHeadDirection(direction);
          // const imageCheck = handleCaptureAndPredict()
          if (!hasGenerated) {
            sendImageToPredictApi()
            // handleCaptureAndPredict()
            hasGenerated = true;
          }
        } else {
          setHeadDirection("")
        }

        // if (!insideOval) {
        //   hasGenerated = false;
        // }

      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // guideCanvasCTX.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
        setLiveness("Face not found");
      }
    }, 0);
  };

  const sendImageToPredictApi = async () => {
    const video = videoRef.current;
    if (!video) return;
  
    const scaleFactor = 0.5; // Adjust as needed
    const canvas = new OffscreenCanvas(video.videoWidth * scaleFactor, video.videoHeight * scaleFactor);    
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    // Convert canvas directly to a Blob (Avoids rendering lag)
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
  
    const formData = new FormData();
    formData.append("file", blob, "image.jpg");
  
    try {
      const response = await axios.post(`${import.meta.env.VITE_MODEL_API}/predict`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      const isPredictionSuccessful = response.data.predicted_class === 2;
      setPredictionResults((prevResults) => [...prevResults, isPredictionSuccessful]);
  
      const successRate = (predictionResults.filter((r) => r).length + (isPredictionSuccessful ? 1 : 0)) / (predictionResults.length + 1);
      setIsAttendanceMarked(successRate > 0.5);
    } catch (error) {
      console.error("Error sending image to API:", error);
    }
  };
  

  // const handleCaptureAndPredict = () => {
  //   if (!model || !videoRef.current) return;

  //   const video = videoRef.current;
  //   const canvas = document.createElement("canvas");
  //   canvas.width = video.videoWidth;
  //   canvas.height = video.videoHeight;

  //   const ctx = canvas.getContext("2d");
  //   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //   let prediction;

  //   // Use tf.tidy() to prevent memory leak
  //   tf.tidy(() => {
  //     const inputTensor = preprocessImage(canvas, [224, 224]);

  //     const predictionResult = model.execute(inputTensor);

  //     prediction = predictionResult.dataSync();  // Extract prediction values

  //     const class_labels = ["3d", "digital", "live", "papercut", "print"];

  //     // Initialize an array to store prediction with class labels
  //     const predictionWithIndex = [];

  //     // Populate the predictionWithIndex array
  //     for (let i = 0; i < prediction.length; i++) {
  //       const value = prediction[i];
  //       const label = class_labels[i];
  //       predictionWithIndex.push({ value, label });
  //     }

  //     // Sort the prediction array by value (highest first)
  //     predictionWithIndex.sort((a, b) => b.value - a.value);

  //     // Get the class with the highest prediction value
  //     const topPrediction = predictionWithIndex[0];

  //     // Assuming 'live' (index 2) is the successful class
  //     const isPredictionSuccessful = topPrediction.label === "live";

  //     // Update prediction results array with success/failure
  //     setPredictionResults((prevResults) => [...prevResults, isPredictionSuccessful]);

  //     // Calculate success rate after each update
  //     const successRate = predictionResults.filter((result) => result).length / predictionResults.length;

  //     // If more than 50% predictions are successful, mark attendance
  //     if (successRate > 0.5) {
  //       setIsAttendanceMarked(true); // Set to true if success rate > 50%
  //     } else {
  //       setIsAttendanceMarked(false);
  //     }
  //   });

  //   // Clean up canvas
  //   canvas.remove();
  // };


  const drawOval = (ctx, width, height, isInside) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Dark background with transparency
    ctx.fillRect(0, 0, width, height); // Fill entire canvas

    ctx.globalCompositeOperation = "destination-out";

    // Use the smaller dimension to keep proportions the same
    const minSize = Math.min(width, height);
    const ovalWidth = minSize * 0.25; // 40% of minSize (narrower)
    const ovalHeight = minSize * 0.35; // 70% of minSize (taller)
    ctx.beginPath();
    ctx.ellipse(
      width / 2,
      height / 2,
      ovalWidth,
      ovalHeight,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Reset globalCompositeOperation for normal drawing
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = isInside ? "green" : "red";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(
      width / 2,
      height / 2,
      ovalWidth,
      ovalHeight,
      0,
      0,
      2 * Math.PI
    );
    ctx.stroke();
  };

  const isFaceInsideOval = (landmarks, width, height) => {
    const ovalX = width / 2;
    const ovalY = height / 2;
    const minSize = Math.min(width, height);
    const ovalWidth = minSize * 0.25; // 40% of minSize (narrower)
    const ovalHeight = minSize * 0.35; // 70% of minSize (taller)
    // const ovalWidth = width / 4;
    // const ovalHeight = height / 3;

    // Select 5 key points from MediaPipe FaceLandmarker
    const top = landmarks[10]; // Forehead
    const bottom = landmarks[152]; // Chin
    const left = landmarks[234]; // Left cheek
    const right = landmarks[454]; // Right cheek
    const middle = landmarks[2]; // Nose tip

    return (
      isPointInsideOval(
        top.x * width,
        top.y * height,
        ovalX,
        ovalY,
        ovalWidth,
        ovalHeight
      ) &&
      isPointInsideOval(
        bottom.x * width,
        bottom.y * height,
        ovalX,
        ovalY,
        ovalWidth,
        ovalHeight
      ) &&
      isPointInsideOval(
        left.x * width,
        left.y * height,
        ovalX,
        ovalY,
        ovalWidth,
        ovalHeight
      ) &&
      isPointInsideOval(
        right.x * width,
        right.y * height,
        ovalX,
        ovalY,
        ovalWidth,
        ovalHeight
      ) &&
      isPointInsideOval(
        middle.x * width,
        middle.y * height,
        ovalX,
        ovalY,
        ovalWidth,
        ovalHeight
      )
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
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
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
    faceCtx.drawImage(
      canvas,
      minX,
      minY,
      faceWidth,
      faceHeight,
      0,
      0,
      faceWidth,
      faceHeight
    );

    const base64Image = faceCanvas.toDataURL("image/png");

    try {
      setVerifyLoading(true);

      if (!location.latitude || !location.longitude) {
        alert("Location not available. Please enable location services and try again.");
        stopWebcam();
        navigate("/");
      }

      const response = await api.post("/attendance", {
        student_id: user._id,
        class_id: class_id,
        photo: base64Image,
        latitude: location.latitude,
        longitude: location.longitude
      });

      setVerifyLoading(false);
      stopWebcam();

      if (response.message === "Attendance marked successfully") {
        Swal.fire({
          icon: "success",
          title: response.message,
          text: `Class: ${response.attendance.class_details.name} (${response.attendance.status})`,
          showConfirmButton: false,
          timer: 3000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: response.message,
          showConfirmButton: false,
          timer: 3000,
        });
      }

      navigate("/");
    } catch (error) {
      setVerifyLoading(false);

      Swal.fire({
        icon: "error",
        title: error.response.data.message,
        showConfirmButton: false,
        timer: 3000,
      });
      stopWebcam();
      navigate("/");
    }
  };

  if (!loading) {
    return (
      <div className="w-full max-w-md mx-auto h-screen flex items-center justify-center">
        <Loading></Loading>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col items-center mt-10 px-4 box-border">
      {/* <h1 className="text-3xl font-bold underline text-center sm:text-xl">{liveness}</h1> */}
      {/* Webcam Detection */}
      {/* <p>{Number(depth1).toFixed(4)}</p>
      <p>{Number(depth2).toFixed(4)}</p>
      <p>{confidence}</p> */}
      {/* <button onClick={sendImageToPredictApi}>Predict</button> */}
      <div className="flex flex-col justify-center items-center mb-1">
        <div>
          <img
            src={faceInside ? `${import.meta.env.VITE_BASE_URL}face-scan.gif` : `${import.meta.env.VITE_BASE_URL}face-frame.png`}
            alt="face scan animation"
            className="w-10 object-cover [clip-path:inset(10%)]"
          />
        </div>
        <h5 className="text-xl">
          {faceInside
            ? "Stay inside the circle."
            : "Move your face into the circle."}
        </h5>
      </div>
      <h2 className="font-bold text-2xl">{instructions[requiredDirections[currentIndex]]}</h2>
      <div className="flex flex-col justify-center items-center mb-4 gap-3">
        
        {/* <p>ท่าที่ต้องทำ: {requiredDirections.join(" → ")}</p> */}
        <div className="grid grid-cols-2 justify-center items-center gap-4">
          <div className="flex flex-col justify-center items-center">
          Target: <DirectionDisplay direction={requiredDirections[currentIndex]} />
          </div>
          <div className="flex flex-col justify-center items-center">
          Current: <DirectionDisplay direction={headDirection} />
          </div>
          
        </div>


        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

          <div
            className="h-full bg-primary transition-all duration-50"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

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
        <div
          id="loading-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60"
        >
          <svg
            className="animate-spin h-8 w-8 text-white mr-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>

          <span className="text-white text-3xl font-bold">FaceVerify...</span>
        </div>
      )}
    </div>
  );
};

export default FaceScan;
