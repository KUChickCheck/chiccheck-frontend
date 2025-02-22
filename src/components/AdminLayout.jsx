import React from 'react'
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import adminRoutes from '../routes/adminRoutes'
import AdminHeader from './AdminHeader'

const AdminLayout = () => {
    const [isVisible, setIsVisible] = useState(true)
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div>
            <AdminSidebar links={adminRoutes} isVisible={isVisible} setIsVisible={setIsVisible} />
            <div className={`h-screen w-full`}>
                <div className={`${isVisible ? "pl-[200px]" : "pl-0"} transition-all duration-500 ease-in-out`}>
                    <AdminHeader isVisible={isVisible} setIsVisible={setIsVisible} />
                </div>
                <div className={`container mx-auto p-4 h-full w-full ${screenWidth > 768 && isVisible ? "pl-[216px]" : "pl-4"} transition-all duration-500 ease-in-out`}>
                    <Outlet /> {/* Render nested routes here */}
                </div>
            </div>
        </div>
    )
}

export default AdminLayout