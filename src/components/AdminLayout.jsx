import React from 'react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

const AdminLayout = () => {
    const [isVisible, setIsVisible] = useState(true)
    return (
        <div>
            <AdminSidebar links={[{label:"test"}]} isVisible={isVisible} setIsVisible={setIsVisible}/>
            <div>
                <Outlet /> {/* Render nested routes here */}
            </div>
        </div>
    )
}

export default AdminLayout