// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducers/authReducer";

const store = configureStore({
  reducer: {
    auth: authReducer, // Add auth reducer here
  },
});

export default store;
