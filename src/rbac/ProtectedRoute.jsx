import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function protectedRoutes({ roles, children }) {
    const user = useSelector(state => state.userDetails);
    return roles.includes(user?.role) ?
        children :
        <Navigate to='/unauthorixed-access' />
}

export default protectedRoutes;