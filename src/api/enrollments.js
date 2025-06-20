import axios from "axios";

const API_URL = "/api/enrollments";

export const getMyEnrollments = async (
  token,
  { page = 1, limit = 10 } = {}
) => {
  try {
    const res = await axios.get(`${API_URL}/my-enrollments`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    if (res.data.success && res.data.enrollments) {
      return {
        enrollments: res.data.enrollments,
        pagination: res.data.pagination,
      };
    }
    throw new Error(res.data.message || "Failed to fetch enrollments");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to fetch enrollments"
    );
  }
};
