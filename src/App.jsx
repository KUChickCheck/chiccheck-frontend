import React from "react";
// import FaceDetection from "./FaceDetection";
import FaceLandmarkerComponent from "./components/FaceLandmarkerComponent";
import Login from "./pages/main/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import Overview from "./pages/admin/Overview";
import Home from "./pages/main/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/facemark" element={<FaceLandmarkerComponent />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="overview" element={<Overview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
