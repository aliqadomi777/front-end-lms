import axios from "axios";

const API_URL = "/api/wishlist";

export const getWishlist = async (token) => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const addToWishlist = async (token, courseId) => {
  const res = await axios.post(
    API_URL,
    { course_id: courseId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.data;
};

export const removeFromWishlist = async (token, courseId) => {
  const res = await axios.delete(`${API_URL}/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.success;
};

export const isInWishlist = async (token, courseId) => {
  const res = await axios.get(`${API_URL}/${courseId}/check`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data?.is_in_wishlist;
};
