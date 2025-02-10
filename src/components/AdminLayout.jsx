import React from 'react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import adminRoutes from '../routes/adminRoutes'
import AdminHeader from './AdminHeader'

const AdminLayout = () => {
    const [isVisible, setIsVisible] = useState(true)
    return (
        <div>
            <AdminSidebar links={adminRoutes} isVisible={isVisible} setIsVisible={setIsVisible}/>
            <div className={`h-screen w-full ${isVisible ? "pl-[200px]" : "pl-0"} transition-all duration-500 ease-in-out`}>
                <AdminHeader isVisible={isVisible} setIsVisible={setIsVisible}/>
                <div className='container mx-auto p-4 h-full w-full'>
                <Outlet /> {/* Render nested routes here */}
                </div>
            </div>
        </div>
    )
}

export default AdminLayout