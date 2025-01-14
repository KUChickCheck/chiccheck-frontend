import React from "react";
// import FaceDetection from "./FaceDetection";
import FaceLandmarkerComponent from "./components/FaceLandmarkerComponent";
import Login from "./pages/main/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/main/Home";
import adminRoutes from "./utilities/adminRoutes";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="" element={<ProtectedRoute user="student"><Home /></ProtectedRoute>}/>
        <Route path="facemark" element={<ProtectedRoute user="student"><FaceLandmarkerComponent /></ProtectedRoute>}/>

        {/* Admin Routes */}
        <Route path="admin/login" element={<Login />} />
        <Route path="admin" element={<AdminLayout />}>
          {adminRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
