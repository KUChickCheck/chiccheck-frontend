import React from 'react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import adminRoutes from '../routes/adminRoutes'

const AdminLayout = () => {
    const [isVisible, setIsVisible] = useState(true)
    return (
        <div>
            <AdminSidebar links={adminRoutes} isVisible={isVisible} setIsVisible={setIsVisible}/>
            <div className='h-screen w-full' style={{paddingLeft: "200px"}}>
                <Outlet /> {/* Render nested routes here */}
            </div>
        </div>
    )
}

export default AdminLayout