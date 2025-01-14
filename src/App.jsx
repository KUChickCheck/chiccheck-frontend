import React, { Suspense, lazy } from "react";
// import FaceDetection from "./FaceDetection";
// Lazy loading the components
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import adminRoutes from "./utilities/adminRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
const Login = lazy(() => import("./pages/main/Login"));
const Home = lazy(() => import("./pages/main/Home"));
const FaceLandmarkerComponent = lazy(() => import("./components/FaceLandmarkerComponent"));

function App() {
  return (
    <BrowserRouter>
    <Suspense fallback={<div></div>}></Suspense>
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
