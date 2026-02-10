import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { serverEndpoint } from "../config/appConfig";
import { usePermission } from "../rbac/userPermissions";

function GroupExpenses() {
    const { groupId } = useParams();
    const permissions = usePermission();

    const [group, setGroup] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [paidBy, setPaidBy] = useState("");
    const [splitType, setSplitType] = useState("equal");
    const [customSplits, setCustomSplits] = useState({});

    const members = useMemo(() => group?.membersEmail || [], [group]);

    const fetchGroupDetails = async () => {
        try {
            setError("");
            const response = await axios.get(
                `${serverEndpoint}/groups/${groupId}/details`,
                { withCredentials: true }
            );

            const incomingGroup = response.data?.group || null;
            const incomingTransactions = response.data?.transactions || [];

            setGroup(incomingGroup);
            setTransactions(incomingTransactions);

            if (incomingGroup?.membersEmail?.length > 0) {
                setPaidBy((current) => current || incomingGroup.membersEmail[0]);
                const initialSplits = {};
                incomingGroup.membersEmail.forEach((memberEmail) => {
                    initialSplits[memberEmail] = "";
                });
                setCustomSplits(initialSplits);
            }
        } catch (apiError) {
            setError(
                apiError?.response?.data?.message ||
                    "Failed to fetch group details."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupDetails();
    }, [groupId]);

    const handleCustomSplitChange = (memberEmail, value) => {
        setCustomSplits((prev) => ({ ...prev, [memberEmail]: value }));
    };

    const handleCreateExpense = async (event) => {
        event.preventDefault();
        if (!group) {
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                title: title.trim(),
                amount: Number(amount),
                paidBy,
                splitType
            };

            if (splitType === "custom") {
                payload.splits = members.map((memberEmail) => ({
                    memberEmail,
                    amount: Number(customSplits[memberEmail] || 0)
                }));
            }

            const response = await axios.post(
                `${serverEndpoint}/groups/${groupId}/expenses`,
                payload,
                { withCredentials: true }
            );

            setTransactions(response.data?.transactions || []);
            setTitle("");
            setAmount("");

            if (splitType === "custom") {
                const resetSplits = {};
                members.forEach((memberEmail) => {
                    resetSplits[memberEmail] = "";
                });
                setCustomSplits(resetSplits);
            }
        } catch (apiError) {
            setError(
                apiError?.response?.data?.message || "Failed to create expense."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/dashboard">Groups</Link>
                    </li>
                    <li className="breadcrumb-item active">Expense Details</li>
                </ol>
            </nav>

            {error && <div className="alert alert-danger">{error}</div>}

            {group && (
                <div className="row g-4">
                    <div className="col-12">
                        <div className="card shadow-sm border-0">
                            <div className="card-body">
                                <h2 className="fw-bold mb-2">{group.name}</h2>
                                <p className="text-muted mb-2">
                                    {group.description || "No description added."}
                                </p>
                                <p className="small text-muted mb-3">
                                    Group ID: <code>{groupId}</code>
                                </p>
                                <div className="d-flex flex-wrap gap-2">
                                    {members.map((memberEmail) => (
                                        <span
                                            key={memberEmail}
                                            className="badge text-bg-light border"
                                        >
                                            {memberEmail}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {permissions.canUpdateGroups && (
                        <div className="col-lg-5">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                    <h5 className="fw-bold mb-3">Add New Expense</h5>
                                    <form onSubmit={handleCreateExpense}>
                                    <div className="mb-3">
                                        <label className="form-label">Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={title}
                                            onChange={(event) =>
                                                setTitle(event.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Amount</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            className="form-control"
                                            value={amount}
                                            onChange={(event) =>
                                                setAmount(event.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Paid By</label>
                                        <select
                                            className="form-select"
                                            value={paidBy}
                                            onChange={(event) =>
                                                setPaidBy(event.target.value)
                                            }
                                            required
                                        >
                                            {members.map((memberEmail) => (
                                                <option
                                                    key={memberEmail}
                                                    value={memberEmail}
                                                >
                                                    {memberEmail}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Split Type
                                        </label>
                                        <select
                                            className="form-select"
                                            value={splitType}
                                            onChange={(event) =>
                                                setSplitType(event.target.value)
                                            }
                                        >
                                            <option value="equal">Equal</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>

                                    {splitType === "custom" && (
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Custom Splits
                                            </label>
                                            <div className="border rounded p-3 bg-light">
                                                {members.map((memberEmail) => (
                                                    <div
                                                        className="mb-2"
                                                        key={memberEmail}
                                                    >
                                                        <label className="form-label small mb-1">
                                                            {memberEmail}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="form-control form-control-sm"
                                                            value={
                                                                customSplits[
                                                                    memberEmail
                                                                ] || ""
                                                            }
                                                            onChange={(event) =>
                                                                handleCustomSplitChange(
                                                                    memberEmail,
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100"
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Create Expense"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="col-lg-7">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <h5 className="fw-bold mb-3">
                                    Past Transactions
                                </h5>

                                {transactions.length === 0 ? (
                                    <p className="text-muted mb-0">
                                        No expenses recorded yet.
                                    </p>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {transactions.map((transaction) => (
                                            <div
                                                key={transaction._id}
                                                className="list-group-item px-0"
                                            >
                                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                                    <div>
                                                        <h6 className="mb-1 fw-bold">
                                                            {transaction.title}
                                                        </h6>
                                                        <div className="small text-muted">
                                                            Paid by{" "}
                                                            {transaction.paidBy} |{" "}
                                                            {new Date(
                                                                transaction.createdAt
                                                            ).toLocaleString()}
                                                        </div>
                                                        <div className="small text-muted text-capitalize">
                                                            Split:{" "}
                                                            {transaction.splitType}
                                                        </div>
                                                    </div>
                                                    <span className="badge text-bg-primary fs-6">
                                                        INR{" "}
                                                        {Number(
                                                            transaction.amount
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 small">
                                                    {transaction.splits?.map(
                                                        (split) => (
                                                            <div
                                                                key={
                                                                    split.memberEmail
                                                                }
                                                            >
                                                                {split.memberEmail}: INR{" "}
                                                                {Number(
                                                                    split.amount
                                                                ).toFixed(2)}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupExpenses;
