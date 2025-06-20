import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessonById,
  markLessonComplete,
  markLessonIncomplete,
} from "../../api/lessons";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";

const LessonDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lesson details
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => getLessonById(token, id),
    enabled: !!token && !!id,
    onError: (err) => addToast("error", err.message || "Failed to load lesson"),
  });

  // Mark complete/incomplete mutations
  const completeMutation = useMutation({
    mutationFn: () => markLessonComplete(token, id),
    onSuccess: () => {
      addToast("success", "Lesson marked as complete!");
      queryClient.invalidateQueries(["lesson", id]);
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to mark complete"),
  });
  const incompleteMutation = useMutation({
    mutationFn: () => markLessonIncomplete(token, id),
    onSuccess: () => {
      addToast("success", "Lesson marked as incomplete.");
      queryClient.invalidateQueries(["lesson", id]);
    },
    onError: (err) =>
      addToast("error", err.message || "Failed to mark incomplete"),
  });

  if (isLoading) {
    return <LoadingSkeleton lines={8} className="mt-10 max-w-2xl mx-auto" />;
  }
  if (isError) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 mb-4">{error.message}</p>
        <PrimaryButton onClick={() => refetch()}>Retry</PrimaryButton>
      </div>
    );
  }

  const { lesson } = data || {};
  if (!lesson) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
      <p className="text-gray-600 mb-4">{lesson.description}</p>
      {/* Video or file embed */}
      {lesson.videoUrl && (
        <div className="mb-4">
          <video controls className="w-full rounded shadow">
            <source src={lesson.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      {lesson.fileUrl && (
        <div className="mb-4">
          <a
            href={lesson.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Download Lesson File
          </a>
        </div>
      )}
      {/* Mark complete/incomplete */}
      <div className="flex gap-4 mt-6">
        {lesson.completed ? (
          <PrimaryButton
            onClick={() => incompleteMutation.mutate()}
            className="bg-yellow-500 hover:bg-yellow-600"
            disabled={incompleteMutation.isLoading}
          >
            Mark as Incomplete
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={() => completeMutation.mutate()}
            className="bg-green-600 hover:bg-green-700"
            disabled={completeMutation.isLoading}
          >
            Mark as Complete
          </PrimaryButton>
        )}
      </div>
      {/* Assignment button */}
      {lesson.hasAssignment && (
        <div className="mt-6">
          <Link to={`/student/assignments/${lesson.id}`}>
            <PrimaryButton className="bg-blue-600 hover:bg-blue-700">
              View Assignment
            </PrimaryButton>
          </Link>
        </div>
      )}
    </div>
  );
};

export default LessonDetail;
