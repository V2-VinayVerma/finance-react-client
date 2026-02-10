import { useEffect, useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import Can from "../components/can";
import { usePermission } from "../rbac/userPermissions";

const initialFormData = {
    name: "",
    email: "",
    role: "viewer"
};

function ManageUsers() {
    const permissions = usePermission();
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState("");

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${serverEndpoint}/users`, {
                withCredentials: true
            });
            setUsers(response?.data?.users || []);
        } catch (error) {
            console.log(error);
            setErrors({ message: "Unable to fetch users. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const validateCreate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }
        if (!isEditMode && !formData.email.trim()) {
            newErrors.email = "Email is required";
        }
        if (!["manager", "viewer", "admin"].includes(formData.role)) {
            newErrors.role = "Role is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setIsEditMode(false);
        setEditingUserId("");
    };

    const handleSubmitUser = async (event) => {
        event.preventDefault();
        setMessage("");

        if (!validateCreate()) {
            return;
        }

        try {
            setActionLoading(true);
            if (isEditMode && editingUserId) {
                const response = await axios.put(
                    `${serverEndpoint}/users/${editingUserId}`,
                    {
                        name: formData.name.trim(),
                        role: formData.role
                    },
                    { withCredentials: true }
                );

                setUsers((prev) =>
                    prev.map((user) =>
                        user._id === editingUserId ? response.data.user : user
                    )
                );
                setMessage("User updated successfully.");
            } else {
                const response = await axios.post(
                    `${serverEndpoint}/users`,
                    {
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        role: formData.role
                    },
                    { withCredentials: true }
                );

                setUsers((prev) => [...prev, response.data.user]);
                setMessage("User added successfully.");
            }

            resetForm();
            setErrors({});
        } catch (error) {
            console.log(error);
            setErrors({
                message:
                    error?.response?.data?.message ||
                    `Unable to ${isEditMode ? "update" : "add"} user. Please try again.`
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartEdit = (user) => {
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role
        });
        setEditingUserId(user._id);
        setIsEditMode(true);
        setErrors({});
        setMessage("");
    };

    const handleCancelEdit = () => {
        resetForm();
        setErrors({});
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Delete this user?")) {
            return;
        }

        try {
            setActionLoading(true);
            await axios.delete(`${serverEndpoint}/users/${userId}`, {
                withCredentials: true
            });
            setUsers((prev) => prev.filter((user) => user._id !== userId));
            if (editingUserId === userId) {
                resetForm();
            }
            setMessage("User deleted successfully.");
        } catch (error) {
            console.log(error);
            setErrors({
                message:
                    error?.response?.data?.message ||
                    "Unable to delete user. Please try again."
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container p-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container p-5">
            {errors.message && (
                <div className="alert alert-danger" role="alert">
                    {errors.message}
                </div>
            )}

            {message && (
                <div className="alert alert-success" role="alert">
                    {message}
                </div>
            )}

            <div className="row align-items-center mb-5">
                <div className="col-md-8 text-center text-md-start mb-3 mb-md-0">
                    <h2 className="fw-bold text-dark display-6">
                        Manage <span className="text-primary">Users</span>
                    </h2>
                    <p className="text-muted mb-0">
                        View and manage users and their permissions.
                    </p>
                </div>
            </div>

            <div className="row g-4">
                <Can requiredPermission="canCreateUsers">
                    <div className="col-md-4">
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    {isEditMode ? "Edit Member" : "Add Member"}
                                </h5>
                            </div>

                            <div className="card-body">
                                <form onSubmit={handleSubmitUser}>
                                    <div className="mb-3">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className={`form-control ${
                                                errors.name ? "is-invalid" : ""
                                            }`}
                                            value={formData.name}
                                            onChange={handleCreateChange}
                                        />
                                        {errors.name && (
                                            <div className="invalid-feedback">
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className={`form-control ${
                                                errors.email ? "is-invalid" : ""
                                            }`}
                                            value={formData.email}
                                            onChange={handleCreateChange}
                                            disabled={isEditMode}
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Role</label>
                                        <select
                                            name="role"
                                            className={`form-select ${
                                                errors.role ? "is-invalid" : ""
                                            }`}
                                            value={formData.role}
                                            onChange={handleCreateChange}
                                        >
                                            <option value="manager">Manager</option>
                                            <option value="viewer">Viewer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        {errors.role && (
                                            <div className="invalid-feedback">
                                                {errors.role}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading
                                            ? isEditMode
                                                ? "Saving..."
                                                : "Adding..."
                                            : isEditMode
                                              ? "Save"
                                              : "Add"}
                                    </button>
                                    {isEditMode && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary w-100 mt-2"
                                            onClick={handleCancelEdit}
                                            disabled={actionLoading}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </Can>

                <div className={permissions.canCreateUsers ? "col-md-8" : "col-md-12"}>
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h5 className="mb-0">Team Members</h5>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="text-center">Name</th>
                                            <th className="text-center">Email</th>
                                            <th className="text-center">Role</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-4 text-muted">
                                                    No users found.
                                                </td>
                                            </tr>
                                        )}

                                        {users.map((user) => (
                                            <tr key={user._id}>
                                                <td className="align-middle">{user.name}</td>
                                                <td className="align-middle">{user.email}</td>
                                                <td className="align-middle">{user.role}</td>
                                                <td className="align-middle text-nowrap">
                                                    <Can requiredPermission="canUpdateUsers">
                                                        <button
                                                            type="button"
                                                            className="btn btn-link text-primary p-0 me-3"
                                                            onClick={() => handleStartEdit(user)}
                                                            disabled={actionLoading}
                                                        >
                                                            Edit
                                                        </button>
                                                    </Can>
                                                    <Can requiredPermission="canDeleteUsers">
                                                        <button
                                                            type="button"
                                                            className="btn btn-link text-danger p-0"
                                                            onClick={() => handleDelete(user._id)}
                                                            disabled={actionLoading}
                                                        >
                                                            Delete
                                                        </button>
                                                    </Can>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageUsers;
