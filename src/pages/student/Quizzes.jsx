import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getQuizzesByCourse } from "../../api/quizzes";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useToast } from "../../components/ToastProvider";

const Quizzes = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const { addToast } = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["quizzes", courseId],
    queryFn: () => getQuizzesByCourse(courseId),
    enabled: !!courseId,
    onError: (err) =>
      addToast("error", err.message || "Failed to load quizzes"),
  });

  if (!courseId) {
    return (
      <div className="text-center mt-10 text-gray-500">
        No course selected. Please access quizzes from a course page.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton lines={8} className="mt-10 max-w-2xl mx-auto" />;
  }
  if (isError) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { quizzes = [] } = data || {};

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quizzes</h1>
      {quizzes.length === 0 ? (
        <div className="text-gray-500">No quizzes found for this course.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="font-semibold text-lg mb-1">{quiz.title}</div>
                <div className="text-gray-500 text-sm mb-2">
                  {quiz.description}
                </div>
              </div>
              <Link
                to={`/student/quizzes/${quiz.id}`}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full text-center"
                aria-label={`Start or continue quiz ${quiz.title}`}
              >
                Start / Continue
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quizzes;
