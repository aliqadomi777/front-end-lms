import axios from "axios";

const API_URL = "/api/assignments";

export const getAssignmentForLesson = async (token, lessonId) => {
  try {
    const res = await axios.get(`${API_URL}/lesson/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.assignment) {
      return { assignment: res.data.assignment };
    }
    throw new Error(res.data.message || "Failed to fetch assignment");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch assignment"
    );
  }
};

export const submitAssignment = async (token, id, formData) => {
  try {
    const res = await axios.post(`${API_URL}/${id}/submit`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    if (res.data.success && res.data.submission) {
      return { submission: res.data.submission };
    }
    throw new Error(res.data.message || "Failed to submit assignment");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to submit assignment"
    );
  }
};

export const getSubmissionStatus = async (token, id) => {
  try {
    const res = await axios.get(`${API_URL}/${id}/submission-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.status) {
      return { status: res.data.status };
    }
    throw new Error(res.data.message || "Failed to fetch submission status");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to fetch submission status"
    );
  }
};

export const getAssignments = async (token, { page = 1, limit = 20 } = {}) => {
  try {
    const res = await axios.get(`${API_URL}/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    if (res.data.success && res.data.assignments) {
      return {
        assignments: res.data.assignments,
        pagination: res.data.pagination,
      };
    }
    throw new Error(res.data.message || "Failed to fetch assignments");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to fetch assignments"
    );
  }
};

export const createAssignment = async (token, data) => {
  try {
    const res = await axios.post(`${API_URL}/`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.assignment) {
      return { assignment: res.data.assignment };
    }
    throw new Error(res.data.message || "Failed to create assignment");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to create assignment"
    );
  }
};

export const updateAssignment = async (token, id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.assignment) {
      return { assignment: res.data.assignment };
    }
    throw new Error(res.data.message || "Failed to update assignment");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to update assignment"
    );
  }
};

export const deleteAssignment = async (token, id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      return { message: res.data.message };
    }
    throw new Error(res.data.message || "Failed to delete assignment");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to delete assignment"
    );
  }
};

export const getMySubmission = async (token, assignmentId) => {
  try {
    const res = await axios.get(`${API_URL}/${assignmentId}/my-submission`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to fetch submission");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch submission"
    );
  }
};
