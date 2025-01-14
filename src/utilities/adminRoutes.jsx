import ProtectedRoute from "../components/ProtectedRoute";
import ManageClass from "../pages/admin/ManageClass";
import Overview from "../pages/admin/Overview";

const adminRoutes = [
  { label: "Overview", path: "overview", element: <ProtectedRoute user="teacher"><Overview /></ProtectedRoute> },
  { label: "Manage Class", path: "manage", element: <ProtectedRoute user="teacher"><ManageClass /></ProtectedRoute>  },
];

// Export the routes array
export default adminRoutes;
