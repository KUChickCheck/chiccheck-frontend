import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utilities/api';
import { useDispatch } from "react-redux";
import { loginUser } from '../../store/actions/authActions';
import Cookies from "js-cookie";
import { Eye, EyeOff } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate()

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = Cookies.get("token") ? Cookies.get("token") : null;
        if (!token) return;
        const response = await api.post(
          "/auth/verify-token",
          { role: "teacher" }, // You can send the role as part of the request body
          {
            headers: {
              Authorization: `Bearer ${token}`, // Correct placement for the Authorization header
            },
          }
        );
        
        if (response.valid) {
          navigate('/admin/overview')
        }
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    };
    verifyToken()
  }, [navigate]);

  const login = async (e) => {
    e.preventDefault();
  
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
  
    try {
      const response = await dispatch(loginUser({ username, password }, "teacher"));
      if (response.type === "LOGIN_SUCCESS") {
        navigate("/admin/overview");
      } else {
        setError("Invalid username or password.");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    }
  };
  

  return (
    <div className="container mx-auto px-4 flex items-center justify-center h-screen">
      <div className="w-full max-w-md">
        <div className='flex justify-center items-center mb-6 gap-1'>
          <img src={import.meta.env.VITE_BASE_URL + "chiccheck.svg" } alt="" width={32} />
          <h1 className="text-center text-3xl font-bold">
            ChicCheck For Teacher
          </h1>

        </div>
        <form onSubmit={login} className="space-y-4">
          <div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Enter username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative w-full">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 text-xl"
          >
            Login
          </button>
        </form>
        {error && (
          <div className="mt-4 text-red-600 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
