import React, { useEffect, useState, useRef } from "react";
import { getAllCategories } from "../../api/courses";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ToastProvider";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import axios from "axios";
import { Link } from "react-router-dom";
import Panel from "../../components/Panel";
import PrimaryButton from "../../components/PrimaryButton";
import EmptyState from "../../components/EmptyState";

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const CourseCatalog = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const debouncedFetch = useRef(
    debounce((params) => fetchCourses(params), 400)
  ).current;

  useEffect(() => {
    getAllCategories(token)
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"));
  }, [token, toast]);

  useEffect(() => {
    debouncedFetch({ search, category, sort, page });
    // eslint-disable-next-line
  }, [search, category, sort, page]);

  const fetchCourses = async ({ search, category, sort, page }) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          category_id: category || undefined,
          sort:
            sort === "newest"
              ? "created_at"
              : sort === "popular"
              ? "enrollments"
              : "title",
          order: sort === "title" ? "asc" : "desc",
          page,
          limit: 8,
        },
      });
      setCourses(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await axios.post(
        `/api/enrollments/${courseId}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Enrolled successfully!");
      debouncedFetch({ search, category, sort, page });
    } catch {
      toast.error("Failed to enroll");
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Course Catalog</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : courses.length === 0 ? (
        <EmptyState message="No courses found." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {courses.map((course) => (
            <Panel key={course.id} className="flex flex-col">
              <img
                src={course.thumbnail_url || "/placeholder.png"}
                alt={course.title}
                className="w-full h-32 object-cover rounded mb-2"
              />
              <div className="font-semibold text-lg mb-1">{course.title}</div>
              <div className="text-gray-500 text-sm mb-2">
                {course.description?.slice(0, 100)}...
              </div>
              <div className="flex-1" />
              <Link
                to={`/student/courses/${course.id}`}
                className="text-blue-600 hover:underline text-sm mb-2"
              >
                View Details
              </Link>
              {course.is_enrolled ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs text-center">
                  Enrolled
                </span>
              ) : (
                <PrimaryButton
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrolling === course.id}
                  className="mt-2"
                >
                  {enrolling === course.id ? "Enrolling..." : "Enroll"}
                </PrimaryButton>
              )}
            </Panel>
          ))}
        </div>
      )}
      {/* Pagination */}
      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <PrimaryButton
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 ${
              p === page
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            disabled={p === page}
          >
            {p}
          </PrimaryButton>
        ))}
      </div>
    </div>
  );
};

export default CourseCatalog;
