import React from 'react'
import { Menu, CircleUserRound, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/actions/authActions";
import { useNavigate } from "react-router-dom";

const AdminHeader = ({ isVisible, setIsVisible }) => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const logout = async () => {
        dispatch(logoutUser());
        navigate("/admin/login")
    };
    return (
        <div className="flex items-center px-4 py-2 shadow-sm justify-between">
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="p-2 focus:outline-none"
            >
                <Menu size={24} />
            </button>
            <div className='flex gap-3 justify-center items-center'>
                {user && <h1 className="text-xl font-semibold hidden sm:block">{user.first_name} {user.last_name}</h1>}
                {/* <CircleUserRound size={24} className="text-primary" /> */}
                <button
                    onClick={logout}
                    className="focus:outline-none"
                >
                    <LogOut size={18} />
                </button>
            </div>



        </div>
    )
}

export default AdminHeader