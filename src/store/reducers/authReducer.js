// src/store/reducers/authReducer.js
import { LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT } from "../actions/actionTypes";
import Cookies from "js-cookie";

const initialState = {
  token: Cookies.get("token") ? Cookies.get("token") : null,
  user: Cookies.get("user") ? JSON.parse(Cookies.get("user")) : null,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        error: null,
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        error: action.payload,
      };
    case LOGOUT:
      return {
        ...state,
        token: null,
        user: null,
        error: null,
      };
    default:
      return state;
  }
};

export default authReducer;
