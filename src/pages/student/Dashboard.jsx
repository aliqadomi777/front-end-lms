import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMyEnrollments } from "../../api/enrollments";
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

const Dashboard = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [wishlistState, setWishlistState] = React.useState({});
  const [loadingIds, setLoadingIds] = React.useState([]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => getMyEnrollments(token),
    enabled: !!token,
    onError: (err) =>
      addToast("error", err.message || "Failed to load enrollments"),
  });

  React.useEffect(() => {
    if (data && data.enrollments && data.enrollments.length && token) {
      data.enrollments.forEach((enrollment) => {
        const courseId = enrollment.course?.id;
        if (courseId && wishlistState[courseId] === undefined) {
          isInWishlist(token, courseId)
            .then((inW) =>
              setWishlistState((prev) => ({ ...prev, [courseId]: inW }))
            )
            .catch(() => {});
        }
      });
    }
    // eslint-disable-next-line
  }, [data, token]);

  const handleWishlist = async (courseId) => {
    if (!token || !courseId) return;
    setLoadingIds((ids) => [...ids, courseId]);
    try {
      if (wishlistState[courseId]) {
        await removeFromWishlist(token, courseId);
        setWishlistState((prev) => ({ ...prev, [courseId]: false }));
      } else {
        await addToWishlist(token, courseId);
        setWishlistState((prev) => ({ ...prev, [courseId]: true }));
      }
    } catch (err) {
      addToast("error", "Failed to update wishlist");
    } finally {
      setLoadingIds((ids) => ids.filter((id) => id !== courseId));
    }
  };

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

  const { enrollments = [] } = data || {};

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Continue Learning</h1>
      {enrollments.length === 0 ? (
        <EmptyState message="You are not enrolled in any courses yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments.map((enrollment) => (
            <Panel
              key={enrollment.id}
              className="flex flex-col justify-between"
            >
              <div>
                <div className="font-semibold text-lg mb-1">
                  {enrollment.course?.title}
                </div>
                <div className="text-gray-500 text-sm mb-2">
                  {enrollment.course?.description}
                </div>
                <PrimaryButton
                  onClick={() => handleWishlist(enrollment.course?.id)}
                  disabled={loadingIds.includes(enrollment.course?.id)}
                  className={`mt-2 px-3 py-1 text-sm w-fit ${
                    wishlistState[enrollment.course?.id]
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                  aria-label={
                    wishlistState[enrollment.course?.id]
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                  style={{
                    backgroundColor: wishlistState[enrollment.course?.id]
                      ? "#fee2e2"
                      : "#d1fae5",
                    color: wishlistState[enrollment.course?.id]
                      ? "#dc2626"
                      : "#047857",
                  }}
                >
                  {loadingIds.includes(enrollment.course?.id)
                    ? "Updating..."
                    : wishlistState[enrollment.course?.id]
                    ? "Remove from Wishlist"
                    : "Add to Wishlist"}
                </PrimaryButton>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full mb-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${enrollment.progress || 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Progress: {enrollment.progress || 0}%
                </div>
              </div>
              <Link
                to={`/student/courses/${enrollment.course?.id}`}
                className="mt-4"
                aria-label={`Continue course ${enrollment.course?.title}`}
              >
                <PrimaryButton className="w-full">Continue</PrimaryButton>
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
