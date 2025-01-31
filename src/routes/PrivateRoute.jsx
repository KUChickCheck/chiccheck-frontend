// src/routes/PrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import api from "../utilities/api";

const PrivateRoute = ({ children, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // `null` means loading
  const dispatch = useDispatch();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        // Send role along with token verification request
        const response = await api.post(
          "/auth/verify-token",
          { role: requiredRole }, // You can send the role as part of the request body
          {
            headers: {
              Authorization: `Bearer ${token}`, // Correct placement for the Authorization header
            },
          }
        );

        if (response.valid) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        setIsAuthenticated(false);
      }
    };

    verifyToken();
  }, [dispatch, requiredRole]);

  if (isAuthenticated === null) {
    return <div></div>; // Show a loading state while verifying
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
