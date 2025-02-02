import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../store/actions/authActions";
// import api from "../api";

const HeaderComponent = ({ title }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const logout = async () => {
    dispatch(logoutUser());
    navigate("/login")
  };

  return (
    <header className="mt-2">
      <div className="container mx-auto py-2 flex justify-between items-center">
        {/* Logo */}
        <div>
          <Link to="/" className="text-decoration-none">
            <img
              src="/chiccheck.svg"
              alt="chiccheck-logo"
              className="h-7 w-auto hover:scale-110 transition-transform"
            />
          </Link>
        </div>

        {/* Title */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        </div>

        {/* Logout */}
        <div
          onClick={logout}
          className="cursor-pointer flex items-center space-x-2 text-red-600 hover:text-red-800"
        >
          <img
            src="/logout.png"
            alt="logout"
            className="h-7 w-auto hover:scale-110 transition-transform"
          />
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent;
