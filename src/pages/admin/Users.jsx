import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  approveInstructor,
  rejectInstructor,
  deleteUser,
} from "../../api/admin";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

const roleLabels = {
  admin: "Admin",
  instructor: "Instructor",
  student: "Student",
};

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const Users = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  const [confirmDialog, setConfirmDialog] = useState({ open: false });

  const debouncedSetSearch = useRef(
    debounce((value) => {
      setSearch(value);
      setPage(1);
    }, 400)
  ).current;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => getAllUsers(token, { page, limit, search }),
    enabled: !!token,
    onError: (err) => addToast("error", err.message || "Failed to load users"),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveInstructor(token, id),
    onSuccess: () => {
      addToast("success", "Instructor approved!");
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to approve instructor"),
  });
  const rejectMutation = useMutation({
    mutationFn: (id) => rejectInstructor(token, id),
    onSuccess: () => {
      addToast("success", "Instructor rejected!");
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to reject instructor"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(token, id),
    onSuccess: () => {
      addToast("success", "User deleted!");
      queryClient.invalidateQueries(["admin-users"]);
    },
    onError: (err) => addToast("error", err.message || "Failed to delete user"),
  });

  const handleSearchChange = (e) => {
    debouncedSetSearch(e.target.value);
  };

  const handleDelete = (user) => {
    setConfirmDialog({
      open: true,
      title: "Delete User",
      message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
      onConfirm: () => {
        setConfirmDialog({ open: false });
        deleteMutation.mutate(user.id);
      },
    });
  };

  const handleReject = (user) => {
    setConfirmDialog({
      open: true,
      title: "Reject Instructor",
      message: `Are you sure you want to reject instructor "${user.name}"? This action cannot be undone.`,
      onConfirm: () => {
        setConfirmDialog({ open: false });
        rejectMutation.mutate(user.id);
      },
    });
  };

  if (isLoading) {
    return <LoadingSkeleton lines={8} className="mt-10 max-w-2xl mx-auto" />;
  }
  if (isError) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 mb-4">{error.message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const { users = [], pagination = {} } = data || {};

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" id="users-table-title">
        User Management
      </h1>
      {/* Search */}
      <form
        className="flex flex-col sm:flex-row gap-4 mb-4 items-center"
        role="search"
        aria-label="User search"
      >
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <input
          id="user-search"
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={handleSearchChange}
          className="border rounded px-3 py-2 w-full sm:w-64"
          aria-label="Search users"
        />
      </form>
      <Panel
        className="overflow-x-auto bg-white rounded-xl shadow-sm"
        tabIndex={0}
        aria-label="Users table wrapper"
      >
        {users.length === 0 ? (
          <EmptyState message="No users found." />
        ) : (
          <table
            className="min-w-full bg-white rounded-xl"
            aria-label="Users table"
            aria-labelledby="users-table-title"
          >
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t hover:bg-blue-50 cursor-pointer"
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                  tabIndex={0}
                  aria-label={`View profile for ${user.name}`}
                >
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2 capitalize">
                    {roleLabels[user.role] || user.role}
                  </td>
                  <td className="px-4 py-2">
                    {user.role === "instructor" ? user.approval_status : "-"}
                  </td>
                  <td className="px-4 py-2">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td
                    className="px-4 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2">
                      {user.role === "instructor" &&
                        user.approval_status === "pending" && (
                          <>
                            <Button
                              onClick={() => approveMutation.mutate(user.id)}
                              disabled={approveMutation.isLoading}
                              aria-label={`Approve instructor ${user.name}`}
                              variant="primary"
                              className="px-3 py-1 text-sm"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReject(user)}
                              disabled={rejectMutation.isLoading}
                              aria-label={`Reject instructor ${user.name}`}
                              variant="secondary"
                              className="px-3 py-1 text-sm bg-yellow-500 text-white hover:bg-yellow-600"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      <Button
                        onClick={() => handleDelete(user)}
                        disabled={deleteMutation.isLoading}
                        aria-label={`Delete user ${user.name}`}
                        variant="danger"
                        className="px-3 py-1 text-sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          variant="secondary"
        >
          Previous
        </Button>
        <span>
          Page {pagination.page || page} of {pagination.pages || "?"}
        </span>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={
            !pagination.pages ||
            page >= pagination.pages ||
            users.length < limit
          }
          aria-label="Next page"
          variant="secondary"
        >
          Next
        </Button>
      </div>
      <ConfirmDialog
        {...confirmDialog}
        onClose={() => setConfirmDialog({ open: false })}
      />
    </div>
  );
};

export default Users;
