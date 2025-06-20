import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

const roleLabels = {
  admin: "Admin",
  instructor: "Instructor",
  student: "Student",
};

const UserProfile = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-user-profile", id],
    queryFn: async () => {
      const res = await axios.get(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    },
    enabled: !!token && !!id,
  });

  if (isLoading) {
    return <LoadingSkeleton lines={8} className="mt-10 max-w-2xl mx-auto" />;
  }
  if (isError) {
    return (
      <div className="max-w-xl mx-auto mt-10 text-center">
        <p className="text-red-500 mb-4">
          {error?.response?.data?.message || error.message}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }
  if (!data) {
    return (
      <EmptyState
        message="No user data found."
        className="max-w-xl mx-auto mt-10"
      />
    );
  }

  return (
    <Panel className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm">
      <Button
        onClick={() => navigate(-1)}
        className="mb-4 px-3 py-1 text-sm w-fit"
        aria-label="Back to users"
        variant="secondary"
      >
        &larr; Back
      </Button>
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <dt className="font-semibold">Name</dt>
        <dd>{data.name}</dd>
        <dt className="font-semibold">Email</dt>
        <dd>{data.email}</dd>
        <dt className="font-semibold">Role</dt>
        <dd>{roleLabels[data.role] || data.role}</dd>
        <dt className="font-semibold">Approval Status</dt>
        <dd>{data.role === "instructor" ? data.approval_status : "-"}</dd>
        <dt className="font-semibold">Active</dt>
        <dd>{data.is_active ? "Yes" : "No"}</dd>
        <dt className="font-semibold">Verified</dt>
        <dd>{data.is_verified ? "Yes" : "No"}</dd>
        <dt className="font-semibold">Created</dt>
        <dd>
          {data.created_at ? new Date(data.created_at).toLocaleString() : "-"}
        </dd>
        {/* Add more fields as needed, strictly backend-aligned */}
      </dl>
    </Panel>
  );
};

export default UserProfile;
