import PrivateRoute from "./PrivateRoute";
import ManageClass from "../pages/admin/ManageClass";
import Overview from "../pages/admin/Overview";

const adminRoutes = [
  { label: "Overview", path: "overview", element: <PrivateRoute requiredRole="teacher"><Overview /></PrivateRoute> },
  { label: "Manage Class", path: "manage", element: <PrivateRoute requiredRole="teacher"><ManageClass /></PrivateRoute>  },
];

// Export the routes array
export default adminRoutes;
