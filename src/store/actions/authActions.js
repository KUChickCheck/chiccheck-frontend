// src/store/actions/authActions.js
import api from "../../utilities/api";
import Cookies from "js-cookie";
import { LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT } from "./actionTypes";

export const loginUser = (credentials, role) => async (dispatch) => {
  try {
    const response = await api.post(`/auth/${role}/login`, credentials); // Adjust the URL to your backend
    const { token, user } = response;

    // Store token and user info in cookies instead of localStorage
    Cookies.set("token", token, { expires: 7, secure: true, sameSite: "Strict" }); // Expires in 7 days
    Cookies.set("user", JSON.stringify(user), { expires: 7, secure: true, sameSite: "Strict" });

    // Dispatch success action with token and user info
    dispatch({
      type: LOGIN_SUCCESS,
      payload: { token, user },
    });

    // Redirect or take necessary action after login success
    // For example, history.push('/dashboard');
    // Return response or success data
    return { type: LOGIN_SUCCESS, payload: { token, user } };

  } catch (error) {
    dispatch({
      type: LOGIN_FAILURE,
      payload: error.message,
    });

    return { type: LOGIN_FAILURE, payload: error.message };
  }
};

export const logoutUser = () => {
  return (dispatch) => {
    Cookies.remove("token");
    Cookies.remove("user");

    // Dispatch logout action
    dispatch({ type: LOGOUT });
  };
};
