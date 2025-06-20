import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import axios from "axios";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import SecondaryButton from "../../components/SecondaryButton";
import EmptyState from "../../components/EmptyState";

const fetchInstructorCourses = async (token) => {
  const res = await axios.get("/api/courses/instructor/my-courses", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.courses || [];
};

const fetchAssignments = async (token, courseId) => {
  const res = await axios.get(`/api/assignments?course_id=${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.assignments || [];
};

const fetchSubmissions = async (token, assignmentId) => {
  const res = await axios.get(`/api/assignments/${assignmentId}/submissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data || [];
};

const gradeSubmission = async (token, submissionId, grade, feedback) => {
  const res = await axios.post(
    `/api/submissions/${submissionId}/grade`,
    { grade, feedback },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.data;
};

const AssignmentSubmissions = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  // Fetch instructor's courses
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ["instructor-courses-list"],
    queryFn: () => fetchInstructorCourses(token),
    enabled: !!token,
  });

  // Fetch assignments for selected course
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments", selectedCourse],
    queryFn: () => fetchAssignments(token, selectedCourse),
    enabled: !!token && !!selectedCourse,
  });

  // Fetch submissions for selected assignment
  const {
    data: submissions,
    isLoading: loadingSubmissions,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["submissions", selectedAssignment],
    queryFn: () => fetchSubmissions(token, selectedAssignment),
    enabled: !!token && !!selectedAssignment,
  });

  // Grade mutation
  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, grade, feedback }) =>
      gradeSubmission(token, submissionId, grade, feedback),
    onSuccess: () => {
      addToast("success", "Submission graded!");
      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");
      queryClient.invalidateQueries(["submissions", selectedAssignment]);
    },
    onError: (err) => {
      addToast("error", err.message || "Failed to grade submission");
    },
  });

  // Handlers
  const handleGrade = (submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || "");
    setFeedback(submission.feedback || "");
  };

  const handleGradeSubmit = (e) => {
    e.preventDefault();
    if (!grade) {
      addToast("error", "Grade is required");
      return;
    }
    gradeMutation.mutate({
      submissionId: selectedSubmission.id,
      grade: Number(grade),
      feedback,
    });
  };

  return (
    <div className="max-w-5xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        Assignment Grading
      </h1>
      {/* Course select */}
      <div className="mb-4">
        <label htmlFor="course-select" className="block font-medium mb-1">
          Select Course
        </label>
        <select
          id="course-select"
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            setSelectedAssignment("");
            setSelectedSubmission(null);
          }}
          className="border rounded px-3 py-2 w-full sm:w-64"
        >
          <option value="">-- Select Course --</option>
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      {/* Assignment select */}
      {selectedCourse && (
        <div className="mb-4">
          <label htmlFor="assignment-select" className="block font-medium mb-1">
            Select Assignment
          </label>
          <select
            id="assignment-select"
            value={selectedAssignment}
            onChange={(e) => {
              setSelectedAssignment(e.target.value);
              setSelectedSubmission(null);
            }}
            className="border rounded px-3 py-2 w-full sm:w-64"
          >
            <option value="">-- Select Assignment --</option>
            {assignments?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Submissions table */}
      {selectedAssignment && (
        <Panel className="bg-white rounded shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            Submissions
          </h2>
          {loadingSubmissions ? (
            <LoadingSkeleton lines={4} />
          ) : submissions?.length === 0 ? (
            <EmptyState message="No submissions yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 border">Student</th>
                    <th className="px-2 py-1 border">Submitted At</th>
                    <th className="px-2 py-1 border">Status</th>
                    <th className="px-2 py-1 border">Grade</th>
                    <th className="px-2 py-1 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id} className="even:bg-gray-50">
                      <td className="px-2 py-1 border">
                        {s.student_name || s.user_id}
                      </td>
                      <td className="px-2 py-1 border">
                        {s.submitted_at
                          ? new Date(s.submitted_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-2 py-1 border">
                        {s.submission_status}
                      </td>
                      <td className="px-2 py-1 border">{s.grade ?? "-"}</td>
                      <td className="px-2 py-1 border">
                        <PrimaryButton
                          className="px-3 py-1 text-xs"
                          onClick={() => handleGrade(s)}
                        >
                          Grade
                        </PrimaryButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
      {/* Grading modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <Panel className="bg-white rounded shadow-lg max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:ring"
              onClick={() => setSelectedSubmission(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Grade Submission</h2>
            <div className="mb-2">
              <span className="font-semibold">Student:</span>{" "}
              {selectedSubmission.student_name || selectedSubmission.user_id}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Submitted At:</span>{" "}
              {selectedSubmission.submitted_at
                ? new Date(selectedSubmission.submitted_at).toLocaleString()
                : "-"}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Submission:</span>
              {selectedSubmission.submission_text && (
                <div className="border rounded p-2 mt-1 bg-gray-50 whitespace-pre-wrap">
                  {selectedSubmission.submission_text}
                </div>
              )}
              {selectedSubmission.submission_url && (
                <div className="mt-1">
                  <a
                    href={selectedSubmission.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Submission URL
                  </a>
                </div>
              )}
              {selectedSubmission.submission_file_url && (
                <div className="mt-1">
                  <a
                    href={selectedSubmission.submission_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
            <form onSubmit={handleGradeSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block font-medium mb-1">Grade</label>
                <input
                  type="number"
                  min={0}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Feedback (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <PrimaryButton
                  type="submit"
                  className="px-4 py-2"
                  disabled={gradeMutation.isLoading}
                >
                  {gradeMutation.isLoading ? "Saving..." : "Save Grade"}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2"
                >
                  Cancel
                </SecondaryButton>
              </div>
            </form>
          </Panel>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissions;
