import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssignmentForLesson,
  submitAssignment,
  getSubmissionStatus,
  getMySubmission,
} from "../../api/assignments";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import dayjs from "dayjs";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";

const AssignmentDetail = () => {
  const { lessonId } = useParams();
  const { token } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef();
  const [mySubmission, setMySubmission] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Fetch assignment
  const {
    data: assignmentData,
    isLoading: assignmentLoading,
    isError: assignmentError,
    error: assignmentErrObj,
  } = useQuery({
    queryKey: ["assignment", lessonId],
    queryFn: () => getAssignmentForLesson(token, lessonId),
    enabled: !!token && !!lessonId,
    onError: (err) =>
      addToast("error", err.message || "Failed to load assignment"),
  });

  // Fetch submission status
  const assignmentId = assignmentData?.assignment?.id;
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
    error: statusErrObj,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["assignment-status", assignmentId],
    queryFn: () => getSubmissionStatus(token, assignmentId),
    enabled: !!token && !!assignmentId,
    onError: (err) =>
      addToast("error", err.message || "Failed to load submission status"),
  });

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: (formData) => submitAssignment(token, assignmentId, formData),
    onSuccess: () => {
      addToast("success", "Assignment submitted successfully!");
      queryClient.invalidateQueries(["assignment-status", assignmentId]);
      fileInputRef.current.value = "";
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to submit assignment"),
  });

  useEffect(() => {
    if (assignmentId && token) {
      getMySubmission(token, assignmentId)
        .then(setMySubmission)
        .catch(() => {});
    }
  }, [assignmentId, token, statusData]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (assignmentLoading || statusLoading) {
    return <LoadingSkeleton lines={8} className="mt-10 max-w-2xl mx-auto" />;
  }
  if (assignmentError) {
    return (
      <div className="text-center mt-10 text-red-500">
        {assignmentErrObj.message}
      </div>
    );
  }
  if (statusError) {
    return (
      <div className="text-center mt-10 text-red-500">
        {statusErrObj.message}
      </div>
    );
  }

  const { assignment } = assignmentData || {};
  const status = statusData?.status;
  const deadline = assignment?.deadline ? dayjs(assignment.deadline) : null;
  const expired =
    deadline &&
    dayjs(now).isAfter(deadline) &&
    !assignment?.allow_late_submission;

  const handleSubmit = (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) {
      addToast("error", "Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    submitMutation.mutate(formData);
  };

  const handleRemoveSubmission = async () => {
    // Implement API call to delete submission if needed
    // For now, just clear file input and refetch
    fileInputRef.current.value = "";
    await refetchStatus();
    setMySubmission(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{assignment?.title}</h1>
      <p className="text-gray-600 mb-4">{assignment?.description}</p>
      {deadline && (
        <div className="mb-2 text-sm text-gray-700">
          Deadline: {deadline.format("YYYY-MM-DD HH:mm")} ({deadline.fromNow()})
          {assignment?.allow_late_submission && (
            <span className="ml-2 text-green-600">Late submission allowed</span>
          )}
        </div>
      )}
      {/* Submission status */}
      {status && (
        <div className="mb-4">
          <span className="font-medium">Submission Status:</span>{" "}
          <span className="inline-block px-2 py-1 rounded text-white bg-blue-500 text-xs">
            {status}
          </span>
        </div>
      )}
      {/* Grade and feedback */}
      {mySubmission && (
        <Panel className="mb-4">
          {mySubmission.points_earned !== undefined && (
            <div>
              <span className="font-medium">Grade:</span>{" "}
              <span className="inline-block px-2 py-1 rounded text-white bg-green-600 text-xs">
                {mySubmission.points_earned} / {assignment?.max_score}
              </span>
            </div>
          )}
          {mySubmission.feedback && (
            <div className="mt-2">
              <span className="font-medium">Instructor Feedback:</span>
              <div className="bg-gray-100 rounded p-2 mt-1 text-sm">
                {mySubmission.feedback}
              </div>
            </div>
          )}
        </Panel>
      )}
      {/* Assignment file upload */}
      {!expired && (
        <Panel as="form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">
              Upload your assignment file
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="block w-full border rounded px-3 py-2"
              disabled={submitMutation.isLoading}
            />
            {mySubmission && (
              <PrimaryButton
                type="button"
                onClick={handleRemoveSubmission}
                className="ml-2 bg-red-100 text-red-600 hover:bg-red-200 text-sm"
              >
                Remove Submission
              </PrimaryButton>
            )}
          </div>
          <PrimaryButton
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={submitMutation.isLoading}
          >
            {submitMutation.isLoading
              ? "Submitting..."
              : mySubmission
              ? "Resubmit Assignment"
              : "Submit Assignment"}
          </PrimaryButton>
        </Panel>
      )}
      {expired && (
        <div className="mt-4 text-red-600 font-semibold">
          The deadline has passed. You can no longer submit or edit this
          assignment.
        </div>
      )}
      <PrimaryButton
        onClick={() => refetchStatus()}
        className="mt-4 bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
      >
        Refresh Submission Status
      </PrimaryButton>
    </div>
  );
};

export default AssignmentDetail;
