import axios from "axios";

const API_URL = "/api/lessons";

export const getLessonsByModule = async (
  token,
  moduleId,
  { page = 1, limit = 20 } = {}
) => {
  try {
    const res = await axios.get(`${API_URL}/module/${moduleId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    if (res.data.success && res.data.lessons) {
      return {
        lessons: res.data.lessons,
        pagination: res.data.pagination,
      };
    }
    throw new Error(res.data.message || "Failed to fetch lessons");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch lessons"
    );
  }
};

export const getLessonById = async (token, id) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.lesson) {
      return { lesson: res.data.lesson };
    }
    throw new Error(res.data.message || "Failed to fetch lesson");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch lesson"
    );
  }
};

export const markLessonComplete = async (token, id) => {
  try {
    const res = await axios.post(
      `${API_URL}/${id}/complete`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || "Failed to mark lesson complete");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to mark lesson complete"
    );
  }
};

export const markLessonIncomplete = async (token, id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}/complete`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || "Failed to mark lesson incomplete");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to mark lesson incomplete"
    );
  }
};

export const createLesson = async (token, moduleId, data) => {
  try {
    const res = await axios.post(`${API_URL}/module/${moduleId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.lesson) {
      return { lesson: res.data.lesson };
    }
    throw new Error(res.data.message || "Failed to create lesson");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to create lesson"
    );
  }
};

export const updateLesson = async (token, id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.lesson) {
      return { lesson: res.data.lesson };
    }
    throw new Error(res.data.message || "Failed to update lesson");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to update lesson"
    );
  }
};

export const deleteLesson = async (token, id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      return { message: res.data.message };
    }
    throw new Error(res.data.message || "Failed to delete lesson");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to delete lesson"
    );
  }
};

export const publishLesson = async (token, id) => {
  try {
    const res = await axios.put(
      `${API_URL}/${id}/publish`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to publish lesson");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to publish lesson"
    );
  }
};

export const unpublishLesson = async (token, id) => {
  try {
    const res = await axios.put(
      `${API_URL}/${id}/unpublish`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to unpublish lesson");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to unpublish lesson"
    );
  }
};

export const reorderLessons = async (token, moduleId, lessonOrders) => {
  try {
    const res = await axios.put(
      `${API_URL}/module/${moduleId}/reorder`,
      { lesson_orders: lessonOrders },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to reorder lessons");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to reorder lessons"
    );
  }
};
