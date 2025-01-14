import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../utilities/api';

const ProtectedRoute = ({ children, user }) => {
    const [isAuthorized, setIsAuthorized] = useState(null); // null = loading, true = authorized, false = unauthorized

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const token = localStorage.getItem("token")
                const response = await api.post("/auth/verify-token", { role: user }, {
                    Authorization: `Bearer ${token}`
                });
                setIsAuthorized(response.valid); // assuming the response determines if the user is authorized
            } catch (error) {
                setIsAuthorized(false);
                console.error('Token verification failed:', error);
            }
        };

        if (isAuthorized === null) {
            verifyToken();
        }
    }, [isAuthorized]);

    if (isAuthorized === null) {
        return (
            <div></div>
        );
    }

    return isAuthorized ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
