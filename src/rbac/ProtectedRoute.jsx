import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { ROLE_PERMISSIONS } from "./userPermissions";

function ProtectedRoute({ roles, requiredPermission, children }) {
    const user = useSelector(state => state.userDetails);

    if (!user) {
        return <Navigate to='/login' />;
    }

    if (Array.isArray(roles) && roles.length > 0) {
        return roles.includes(user?.role) ?
            children :
            <Navigate to='/unauthorized-access' />;
    }

    if (requiredPermission) {
        const userPermissions = ROLE_PERMISSIONS[user?.role] || {};
        return userPermissions[requiredPermission] ?
            children :
            <Navigate to='/unauthorized-access' />;
    }

    return children;
}

export default ProtectedRoute;
