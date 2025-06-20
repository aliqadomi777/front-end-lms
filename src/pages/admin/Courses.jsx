import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllCourses, approveCourse, rejectCourse } from "../../api/admin";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useNavigate, Link } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import Button from "../../components/Button";
import Panel from "../../components/Panel";
import EmptyState from "../../components/EmptyState";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const Courses = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ open: false });

  const debouncedSetSearch = useRef(
    debounce((value) => {
      setSearch(value);
      setPage(1);
    }, 400)
  ).current;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-courses", page, search, status],
    queryFn: () => getAllCourses(token, { page, limit, search, status }),
    enabled: !!token,
    onError: (err) =>
      addToast("error", err.message || "Failed to load courses"),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveCourse(token, id),
    onSuccess: () => {
      addToast("success", "Course approved!");
      queryClient.invalidateQueries(["admin-courses"]);
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to approve course"),
  });
  const rejectMutation = useMutation({
    mutationFn: (id) => rejectCourse(token, id),
    onSuccess: () => {
      addToast("success", "Course rejected!");
      queryClient.invalidateQueries(["admin-courses"]);
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to reject course"),
  });

  const handleSearchChange = (e) => {
    debouncedSetSearch(e.target.value);
  };
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleApprove = (course) => {
    setConfirmDialog({
      open: true,
      title: "Approve Course",
      message: `Are you sure you want to approve course "${course.title}"?`,
      onConfirm: () => {
        setConfirmDialog({ open: false });
        approveMutation.mutate(course.id);
      },
    });
  };
  const handleReject = (course) => {
    setConfirmDialog({
      open: true,
      title: "Reject Course",
      message: `Are you sure you want to reject course "${course.title}"? This action cannot be undone.`,
      onConfirm: () => {
        setConfirmDialog({ open: false });
        rejectMutation.mutate(course.id);
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

  const { courses = [], pagination = {} } = data || {};

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" id="courses-table-title">
        Course Management
      </h1>
      {/* Search and filter */}
      <form
        className="flex flex-col sm:flex-row gap-4 mb-4 items-center"
        role="search"
        aria-label="Course search and filter"
      >
        <label htmlFor="course-search" className="sr-only">
          Search courses
        </label>
        <input
          id="course-search"
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={handleSearchChange}
          className="border rounded px-3 py-2 w-full sm:w-64"
          aria-label="Search courses"
        />
        <label htmlFor="course-status" className="sr-only">
          Filter by status
        </label>
        <select
          id="course-status"
          value={status}
          onChange={handleStatusChange}
          className="border rounded px-3 py-2 w-full sm:w-48"
          aria-label="Filter by status"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </form>
      <Panel
        className="overflow-x-auto bg-white rounded-xl shadow-sm"
        tabIndex={0}
        aria-label="Courses table wrapper"
      >
        {courses.length === 0 ? (
          <EmptyState message="No courses found." />
        ) : (
          <table
            className="min-w-full bg-white rounded-xl"
            aria-label="Courses table"
            aria-labelledby="courses-table-title"
          >
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Instructor</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course.id}
                  className="border-t hover:bg-blue-50 cursor-pointer"
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                  tabIndex={0}
                  aria-label={`View course ${course.title}`}
                >
                  <td className="px-4 py-2">
                    <Link
                      to={`/admin/courses/${course.id}`}
                      className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                    >
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {course.instructor?.name || "-"}
                  </td>
                  <td className="px-4 py-2 capitalize">
                    {course.status || "-"}
                  </td>
                  <td className="px-4 py-2">
                    {course.created_at
                      ? new Date(course.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td
                    className="px-4 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2">
                      {course.status === "pending" && (
                        <>
                          <Button
                            onClick={() => handleApprove(course)}
                            disabled={approveMutation.isLoading}
                            aria-label={`Approve course ${course.title}`}
                            variant="primary"
                            className="px-3 py-1 text-sm"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(course)}
                            disabled={rejectMutation.isLoading}
                            aria-label={`Reject course ${course.title}`}
                            variant="danger"
                            className="px-3 py-1 text-sm"
                          >
                            Reject
                          </Button>
                        </>
                      )}
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
            courses.length < limit
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

export default Courses;
