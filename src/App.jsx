import React, { Suspense, lazy } from "react";
// import FaceDetection from "./FaceDetection";
// Lazy loading the components
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import adminRoutes from "./routes/adminRoutes";
import PrivateRoute from "./routes/PrivateRoute";
import Login from "./pages/main/Login";
import AdminLogin from "./pages/admin/AdminLogin";
import FaceScan from "./pages/main/FaceScan";
import IndividualReport from "./pages/main/IndividualReport";
const Home = lazy(() => import("./pages/main/Home"));
const FaceLandmarkerComponent = lazy(() => import("./components/FaceLandmarkerComponent"));

function App() {
  return (
    <BrowserRouter>
    <Suspense fallback={<div></div>}></Suspense>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="" element={<PrivateRoute requiredRole="student"><Home /></PrivateRoute>}/>
        <Route path="/face-scan" element={<PrivateRoute requiredRole="student"><FaceScan /></PrivateRoute>}/>
        <Route path="/report" element={<PrivateRoute requiredRole="student"><IndividualReport /></PrivateRoute>}/>
        <Route path="facemark" element={<FaceLandmarkerComponent />}/>

        {/* Admin Routes */}
        <Route path="admin/login" element={<AdminLogin />} />
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
