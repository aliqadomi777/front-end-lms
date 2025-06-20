import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

const statusLabel = (course) => {
  if (course.is_approved === false) return "Rejected";
  if (course.is_approved === true) return "Approved";
  return "Pending";
};

const CourseProfile = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-course-profile", id],
    queryFn: async () => {
      const res = await axios.get(`/api/courses/${id}`, {
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
        message="No course data found."
        className="max-w-xl mx-auto mt-10"
      />
    );
  }

  return (
    <Panel className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm">
      <Button
        onClick={() => navigate(-1)}
        className="mb-4 px-3 py-1 text-sm w-fit"
        aria-label="Back to courses"
        variant="secondary"
      >
        &larr; Back
      </Button>
      <h1 className="text-2xl font-bold mb-4">Course Profile</h1>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <dt className="font-semibold">Title</dt>
        <dd>{data.title}</dd>
        <dt className="font-semibold">Description</dt>
        <dd>{data.description || "-"}</dd>
        <dt className="font-semibold">Instructor</dt>
        <dd>{data.instructor_name || data.instructor_id || "-"}</dd>
        <dt className="font-semibold">Category</dt>
        <dd>{data.category_name || data.category_id || "-"}</dd>
        <dt className="font-semibold">Status</dt>
        <dd>{statusLabel(data)}</dd>
        <dt className="font-semibold">Published</dt>
        <dd>{data.is_published ? "Yes" : "No"}</dd>
        <dt className="font-semibold">Created</dt>
        <dd>
          {data.created_at ? new Date(data.created_at).toLocaleString() : "-"}
        </dd>
        {/* Add more fields as needed, strictly backend-aligned */}
      </dl>
      {data.modules && data.modules.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Modules</h2>
          <ul className="list-disc pl-6">
            {data.modules.map((mod) => (
              <li key={mod.id} className="mb-1">
                {mod.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
};

export default CourseProfile;
