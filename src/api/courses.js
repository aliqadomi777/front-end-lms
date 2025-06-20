import axios from "axios";

const API_URL = "/api/courses";

export const getCourseById = async (id, token) => {
  const res = await axios.get(`/api/courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const createCourse = async (token, data) => {
  try {
    const res = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.course) {
      return { course: res.data.course };
    }
    throw new Error(res.data.message || "Failed to create course");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to create course"
    );
  }
};

export const updateCourse = async (token, id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.course) {
      return { course: res.data.course };
    }
    throw new Error(res.data.message || "Failed to update course");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to update course"
    );
  }
};

export const deleteCourse = async (token, id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      return { message: res.data.message };
    }
    throw new Error(res.data.message || "Failed to delete course");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to delete course"
    );
  }
};

export const publishCourse = async (token, id) => {
  try {
    const res = await axios.put(
      `/api/courses/${id}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to publish course");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to publish course"
    );
  }
};

export const unpublishCourse = async (token, id) => {
  try {
    const res = await axios.put(
      `/api/courses/${id}/unpublish`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to unpublish course");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to unpublish course"
    );
  }
};

export const getAllCategories = async (token) => {
  const res = await axios.get("/api/categories", {
    headers: { Authorization: `Bearer ${token}` },
  });
  // The backend returns { success: true, data: { data: [categories], pagination: {...} } }
  return res.data.data.data;
};
