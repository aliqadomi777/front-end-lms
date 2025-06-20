import axios from "axios";

const API_URL = "/api/courses/instructor/my-courses";

export const getMyCourses = async (token, { page = 1, limit = 10 } = {}) => {
  try {
    const res = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    if (res.data.success && res.data.courses) {
      return {
        courses: res.data.courses,
        pagination: res.data.pagination,
      };
    }
    throw new Error(res.data.message || "Failed to fetch courses");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch courses"
    );
  }
};
