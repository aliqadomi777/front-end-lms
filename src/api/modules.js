import axios from "axios";

const API_URL = "/api/modules";

export const getModulesByCourse = async (
  token,
  courseId,
  { page = 1, limit = 20 } = {}
) => {
  try {
    const res = await axios.get(`${API_URL}/course/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    if (res.data.success && res.data.modules) {
      return {
        modules: res.data.modules,
        pagination: res.data.pagination,
      };
    }
    throw new Error(res.data.message || "Failed to fetch modules");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch modules"
    );
  }
};

export const createModule = async (token, courseId, data) => {
  try {
    const res = await axios.post(`${API_URL}/course/${courseId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.module) {
      return { module: res.data.module };
    }
    throw new Error(res.data.message || "Failed to create module");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to create module"
    );
  }
};

export const updateModule = async (token, id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.module) {
      return { module: res.data.module };
    }
    throw new Error(res.data.message || "Failed to update module");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to update module"
    );
  }
};

export const deleteModule = async (token, id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      return { message: res.data.message };
    }
    throw new Error(res.data.message || "Failed to delete module");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to delete module"
    );
  }
};

export const publishModule = async (token, id) => {
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
    throw new Error(res.data.message || "Failed to publish module");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to publish module"
    );
  }
};

export const unpublishModule = async (token, id) => {
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
    throw new Error(res.data.message || "Failed to unpublish module");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to unpublish module"
    );
  }
};

export const reorderModules = async (token, courseId, moduleOrders) => {
  try {
    const res = await axios.put(
      `${API_URL}/course/${courseId}/reorder`,
      { module_orders: moduleOrders },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to reorder modules");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to reorder modules"
    );
  }
};
