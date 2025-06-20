import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMyCourses } from "../../api/instructorCourses";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import DOMPurify from "dompurify";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import EmptyState from "../../components/EmptyState";

const Dashboard = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [showBanner, setShowBanner] = useState(true);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: () => getMyCourses(token),
    enabled: !!token,
    onError: (err) =>
      addToast("error", err.message || "Failed to load courses"),
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

  const { courses = [] } = data || {};

  return (
    <div className="max-w-5xl mx-auto">
      {showBanner && (
        <Panel className="bg-blue-50 border border-blue-200 mb-8 flex items-center justify-between transition-all">
          <span className="text-blue-800 font-medium">
            Welcome! Here you can manage your courses, assignments, quizzes, and
            view analytics. Need help? See the documentation.
          </span>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-4 px-2 py-1 text-blue-700 hover:text-white hover:bg-blue-600 rounded focus:outline-none focus:ring transition"
            aria-label="Dismiss info banner"
          >
            ×
          </button>
        </Panel>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">My Courses</h1>
        <Link to="/instructor/courses/new" aria-label="Create new course">
          <PrimaryButton>+ Create Course</PrimaryButton>
        </Link>
      </div>
      {courses.length === 0 ? (
        <EmptyState message="You have not created any courses yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Panel
              key={course.id}
              className="flex flex-col justify-between transition hover:shadow-lg focus-within:shadow-lg"
            >
              <div>
                <div className="font-semibold text-lg mb-1 text-blue-800">
                  {course.title}
                </div>
                <div className="text-gray-500 text-sm mb-2">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(course.description),
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  to={`/instructor/courses/${course.id}`}
                  aria-label={`Edit course ${course.title}`}
                >
                  <PrimaryButton className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700">
                    Edit
                  </PrimaryButton>
                </Link>
                <PrimaryButton
                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700"
                  aria-label={`Publish course ${course.title}`}
                >
                  Publish
                </PrimaryButton>
                <PrimaryButton
                  className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700"
                  aria-label={`View analytics for course ${course.title}`}
                >
                  Analytics
                </PrimaryButton>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
