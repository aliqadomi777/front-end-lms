import axios from "axios";

export const getAllUsers = async (token, { page = 1, limit = 20 } = {}) => {
  try {
    const res = await axios.get("/api/users/", {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    if (res.data.success && res.data.users) {
      return {
        users: res.data.users,
        pagination: res.data.pagination,
      };
    }
    throw new Error(res.data.message || "Failed to fetch users");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch users"
    );
  }
};

export const approveInstructor = async (token, id) => {
  try {
    const res = await axios.put(
      `/api/users/${id}/approve`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || "Failed to approve instructor");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to approve instructor"
    );
  }
};

export const rejectInstructor = async (token, id) => {
  try {
    const res = await axios.put(
      `/api/users/${id}/reject`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || "Failed to reject instructor");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to reject instructor"
    );
  }
};

export const deleteUser = async (token, id) => {
  try {
    const res = await axios.delete(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || "Failed to delete user");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to delete user"
    );
  }
};

export const getAllCourses = async (token, { page = 1, limit = 20 } = {}) => {
  try {
    const res = await axios.get("/api/courses/", {
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

export const approveCourse = async (token, id) => {
  try {
    const res = await axios.put(
      `/api/courses/${id}/approve`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || "Failed to approve course");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to approve course"
    );
  }
};

export const rejectCourse = async (token, id) => {
  try {
    const res = await axios.put(
      `/api/courses/${id}/reject`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || "Failed to reject course");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to reject course"
    );
  }
};

export const getAdminDashboard = async (token) => {
  try {
    const res = await axios.get("/api/analytics/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.data) {
      return { data: res.data.data };
    }
    throw new Error(res.data.message || "Failed to fetch admin dashboard");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to fetch admin dashboard"
    );
  }
};

export const getAdminMetrics = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/admin/metrics", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const getEnrollmentTrends = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/trends/enrollment", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const getWeeklyEngagement = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/engagement/weekly", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const getTopStudents = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/students/top", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const getTopCourses = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/admin/metrics", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data?.topCourses || [];
};

export const getLessonHeatmap = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/lessons/completion-heatmap", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const getAssessmentStats = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/assessments/stats", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const getSystemHealth = async (token) => {
  const res = await axios.get("/api/analytics/admin/system/health", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const getRealtimeDashboard = async (token) => {
  const res = await axios.get("/api/analytics/realtime/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const getCourseStats = async (token, courseId, params = {}) => {
  const res = await axios.get(`/api/analytics/courses/${courseId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const getCourseStudents = async (token, courseId, params = {}) => {
  const res = await axios.get(`/api/analytics/courses/${courseId}/students`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const getCoursesReport = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/admin/reports/courses", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
};

export const exportAnalytics = async (token, params = {}) => {
  const res = await axios.get("/api/analytics/export", {
    headers: { Authorization: `Bearer ${token}` },
    params,
    responseType: "blob",
  });
  return res.data;
};
