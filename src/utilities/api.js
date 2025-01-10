// src/utils/axiosInstance.js

import axios from "axios";

// Create an instance of axios with default settings
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Use an environment variable for the base URL
  timeout: 10000, // Set a timeout limit (in milliseconds)
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Assuming token is stored in localStorage
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API call error:", error);
    return Promise.reject(error);
  }
);

// Utility functions for GET and POST requests
const api = {
  get: async (url, config = {}) => {
    try {
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  post: async (url, data, config = {}) => {
    try {
      const response = await axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  put: async (url, data, config = {}) => {
    try {
      const response = await axiosInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  patch: async (url, data, config = {}) => {
    try {
      const response = await axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      const response = await axiosInstance.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
