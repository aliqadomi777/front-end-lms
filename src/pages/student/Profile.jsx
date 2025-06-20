import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getMyEnrollments } from "../../api/enrollments";
import { getWishlist } from "../../api/wishlist";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { Link } from "react-router-dom";
import Panel from "../../components/Panel";
import EmptyState from "../../components/EmptyState";

const Profile = () => {
  const { token, user } = useAuth();
  const toast = useToast();
  const [enrollments, setEnrollments] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const enrollData = await getMyEnrollments(token);
        setEnrollments(enrollData.enrollments || []);
        const wishData = await getWishlist(token);
        setWishlist(wishData || []);
      } catch (err) {
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, toast]);

  const completedCourses = enrollments.filter((e) => e.progress === 100);
  const activeCourses = enrollments.filter((e) => e.progress < 100);

  if (loading) return <LoadingSkeleton count={4} />;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <Panel className="mb-6">
        <div className="font-semibold text-lg mb-1">{user?.name}</div>
        <div className="text-gray-600 mb-1">{user?.email}</div>
        <div className="text-gray-500 text-sm">Role: {user?.role}</div>
      </Panel>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Current Enrollments</h2>
        {activeCourses.length === 0 ? (
          <EmptyState message="No active courses." />
        ) : (
          <div className="space-y-4">
            {activeCourses.map((e) => (
              <Panel
                key={e.id}
                className="bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <Link
                    to={`/student/courses/${e.course?.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {e.course?.title}
                  </Link>
                  <div className="text-gray-500 text-sm">
                    {e.course?.description}
                  </div>
                </div>
                <div className="mt-2 md:mt-0 md:ml-4">
                  <div className="h-2 bg-gray-200 rounded-full mb-1 w-40">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${e.progress || 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    Progress: {e.progress || 0}%
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Completed Courses</h2>
        {completedCourses.length === 0 ? (
          <EmptyState message="No completed courses yet." />
        ) : (
          <div className="space-y-4">
            {completedCourses.map((e) => (
              <Panel
                key={e.id}
                className="bg-green-50 flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <Link
                    to={`/student/courses/${e.course?.id}`}
                    className="font-medium text-green-700 hover:underline"
                  >
                    {e.course?.title}
                  </Link>
                  <div className="text-gray-500 text-sm">
                    {e.course?.description}
                  </div>
                </div>
                <div className="mt-2 md:mt-0 md:ml-4">
                  <span className="text-green-700 font-semibold">
                    Completed
                  </span>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Wishlist</h2>
        {wishlist.length === 0 ? (
          <EmptyState message="No courses in wishlist." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlist.map((item) => (
              <Panel key={item.course_id} className="flex flex-col items-start">
                <Link
                  to={`/student/courses/${item.course_id}`}
                  className="font-medium text-blue-700 hover:underline mb-1"
                >
                  {item.course_title}
                </Link>
                <div className="text-gray-500 text-sm mb-2">
                  {item.course_description?.slice(0, 80)}...
                </div>
                <img
                  src={item.thumbnail_url || "/placeholder.png"}
                  alt={item.course_title}
                  className="w-24 h-16 object-cover rounded"
                />
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
