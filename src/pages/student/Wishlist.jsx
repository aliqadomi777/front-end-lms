import React, { useEffect, useState } from "react";
import { getWishlist, removeFromWishlist } from "../../api/wishlist";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { Link } from "react-router-dom";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import EmptyState from "../../components/EmptyState";

const Wishlist = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const data = await getWishlist(token);
        setWishlist(data);
      } catch (err) {
        toast.error("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [token, toast]);

  const handleRemove = async (courseId) => {
    setRemoving(courseId);
    try {
      await removeFromWishlist(token, courseId);
      setWishlist((prev) => prev.filter((c) => c.course_id !== courseId));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return <LoadingSkeleton count={3} />;
  if (!wishlist.length) return <EmptyState message="Your wishlist is empty." />;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {wishlist.map((item) => (
          <Panel key={item.course_id} className="flex flex-col items-start">
            <Link to={`/student/courses/${item.course_id}`} className="w-full">
              <img
                src={item.thumbnail_url || "/placeholder.png"}
                alt={item.course_title}
                className="w-full h-24 object-cover rounded mb-2"
              />
              <div className="font-medium text-blue-700 hover:underline mb-1">
                {item.course_title}
              </div>
              <div className="text-gray-500 text-sm mb-2">
                {item.course_description?.slice(0, 80)}...
              </div>
            </Link>
            <PrimaryButton
              onClick={() => handleRemove(item.course_id)}
              disabled={removing === item.course_id}
              aria-label="Remove from wishlist"
              className="mt-2 bg-red-100 text-red-600 hover:bg-red-200"
            >
              {removing === item.course_id ? "Removing..." : "Remove"}
            </PrimaryButton>
          </Panel>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
