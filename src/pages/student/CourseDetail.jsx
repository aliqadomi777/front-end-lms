import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCourseById } from "../../api/courses";
import { getModulesByCourse } from "../../api/modules";
import { getLessonsByModule } from "../../api/lessons";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import {
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from "../../api/wishlist";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import EmptyState from "../../components/EmptyState";

const CourseDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const { addToast } = useToast();
  const [wishlistLoading, setWishlistLoading] = React.useState(false);
  const [inWishlist, setInWishlist] = React.useState(false);

  // Fetch course details
  const {
    data: courseData,
    isLoading: courseLoading,
    isError: courseError,
    error: courseErrObj,
  } = useQuery({
    queryKey: ["course", id],
    queryFn: () => getCourseById(id),
    enabled: !!id,
    onError: (err) => addToast("error", err.message || "Failed to load course"),
  });

  // Fetch modules
  const {
    data: modulesData,
    isLoading: modulesLoading,
    isError: modulesError,
    error: modulesErrObj,
  } = useQuery({
    queryKey: ["modules", id],
    queryFn: () => getModulesByCourse(token, id),
    enabled: !!token && !!id,
    onError: (err) =>
      addToast("error", err.message || "Failed to load modules"),
  });

  // Fetch lessons for each module
  const modules = modulesData?.modules || [];
  const lessonsQueries = modules.map((mod) =>
    useQuery({
      queryKey: ["lessons", mod.id],
      queryFn: () => getLessonsByModule(token, mod.id),
      enabled: !!token && !!mod.id,
    })
  );

  React.useEffect(() => {
    if (courseData?.course?.id && token) {
      isInWishlist(token, courseData.course.id)
        .then(setInWishlist)
        .catch(() => {});
    }
  }, [courseData?.course?.id, token]);

  const handleWishlist = async () => {
    if (!token || !courseData?.course?.id) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(token, courseData.course.id);
        setInWishlist(false);
      } else {
        await addToWishlist(token, courseData.course.id);
        setInWishlist(true);
      }
    } catch (err) {
      addToast("error", "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (courseLoading || modulesLoading) {
    return <LoadingSkeleton lines={10} className="mt-10 max-w-3xl mx-auto" />;
  }
  if (courseError) {
    return (
      <div className="text-center mt-10 text-red-500">
        {courseErrObj.message}
      </div>
    );
  }
  if (modulesError) {
    return (
      <div className="text-center mt-10 text-red-500">
        {modulesErrObj.message}
      </div>
    );
  }

  const { course } = courseData || {};

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{course?.title}</h1>
      <p className="text-gray-600 mb-6">{course?.description}</p>
      <PrimaryButton
        onClick={handleWishlist}
        disabled={wishlistLoading}
        className={`mb-4 ${
          inWishlist
            ? "bg-red-100 text-red-600 hover:bg-red-200"
            : "bg-green-100 text-green-700 hover:bg-green-200"
        }`}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        style={{
          backgroundColor: inWishlist ? "#fee2e2" : "#d1fae5",
          color: inWishlist ? "#dc2626" : "#047857",
        }}
      >
        {wishlistLoading
          ? "Updating..."
          : inWishlist
          ? "Remove from Wishlist"
          : "Add to Wishlist"}
      </PrimaryButton>
      {/* Quizzes button */}
      <div className="mb-6">
        <Link
          to={`/student/quizzes?courseId=${course?.id}`}
          aria-label={`View quizzes for course ${course?.title}`}
        >
          <PrimaryButton className="bg-purple-600 hover:bg-purple-700">
            View Quizzes
          </PrimaryButton>
        </Link>
      </div>
      {modules.length === 0 ? (
        <EmptyState message="No modules found for this course." />
      ) : (
        <div className="space-y-6">
          {modules.map((mod, idx) => {
            const lessonsQuery = lessonsQueries[idx];
            const lessons = lessonsQuery.data?.lessons || [];
            return (
              <Panel key={mod.id}>
                <div className="font-semibold text-lg mb-2">{mod.title}</div>
                {lessonsQuery.isLoading ? (
                  <LoadingSkeleton lines={3} />
                ) : lessonsQuery.isError ? (
                  <div className="text-red-500">
                    {lessonsQuery.error.message}
                  </div>
                ) : lessons.length === 0 ? (
                  <EmptyState message="No lessons in this module." />
                ) : (
                  <ul className="space-y-2">
                    {lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-blue-50 transition"
                      >
                        <span>{lesson.title}</span>
                        <Link
                          to={`/student/lessons/${lesson.id}`}
                          className="text-blue-600 hover:underline text-sm"
                          aria-label={`View lesson ${lesson.title}`}
                        >
                          View
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
