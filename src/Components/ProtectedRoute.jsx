import { Navigate } from "react-router-dom";
import { isAuthenticated, isOperationsAdmin } from "../Utils/auth";

function ProtectedRoute({ children, superAdminOnly = false }) {

  if(!isAuthenticated()){
    return <Navigate to="/" />;
  }

  if (superAdminOnly && isOperationsAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
