import axios from "axios";

const API_URL = "/api/quizzes";

export const getQuizzesByCourse = async (
  courseId,
  { page = 1, limit = 10 } = {}
) => {
  try {
    const res = await axios.get(`${API_URL}/course/${courseId}`, {
      params: { page, limit },
    });
    if (res.data.success && res.data.quizzes) {
      return {
        quizzes: res.data.quizzes,
        pagination: res.data.pagination,
      };
    }
    throw new Error(res.data.message || "Failed to fetch quizzes");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch quizzes"
    );
  }
};

export const getQuizById = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    if (res.data.success && res.data.quiz) {
      return { quiz: res.data.quiz };
    }
    throw new Error(res.data.message || "Failed to fetch quiz");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch quiz"
    );
  }
};

export const startQuizAttempt = async (token, id) => {
  try {
    const res = await axios.post(
      `${API_URL}/${id}/start`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.attempt) {
      return { attempt: res.data.attempt };
    }
    throw new Error(res.data.message || "Failed to start quiz attempt");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to start quiz attempt"
    );
  }
};

export const submitQuizAttempt = async (token, id, answers) => {
  try {
    const res = await axios.post(
      `${API_URL}/${id}/submit`,
      { answers },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.result) {
      return { result: res.data.result };
    }
    throw new Error(res.data.message || "Failed to submit quiz");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to submit quiz"
    );
  }
};

export const createQuiz = async (token, data) => {
  try {
    const res = await axios.post(`${API_URL}/`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.quiz) {
      return { quiz: res.data.quiz };
    }
    throw new Error(res.data.message || "Failed to create quiz");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to create quiz"
    );
  }
};

export const updateQuiz = async (token, id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.quiz) {
      return { quiz: res.data.quiz };
    }
    throw new Error(res.data.message || "Failed to update quiz");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to update quiz"
    );
  }
};

export const deleteQuiz = async (token, id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      return { message: res.data.message };
    }
    throw new Error(res.data.message || "Failed to delete quiz");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to delete quiz"
    );
  }
};

export const getQuestionsByQuiz = async (quizId) => {
  try {
    const res = await axios.get(`/api/quizzes/${quizId}/questions`);
    if (res.data.success && res.data.questions) {
      return { questions: res.data.questions };
    }
    throw new Error(res.data.message || "Failed to fetch questions");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch questions"
    );
  }
};

export const createQuestion = async (token, quizId, data) => {
  try {
    const res = await axios.post(`/api/quizzes/${quizId}/questions`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.question) {
      return { question: res.data.question };
    }
    throw new Error(res.data.message || "Failed to create question");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to create question"
    );
  }
};

export const updateQuestion = async (token, questionId, data) => {
  try {
    const res = await axios.put(`/api/questions/${questionId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success && res.data.question) {
      return { question: res.data.question };
    }
    throw new Error(res.data.message || "Failed to update question");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to update question"
    );
  }
};

export const deleteQuestion = async (token, questionId) => {
  try {
    const res = await axios.delete(`/api/questions/${questionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.success) {
      return { message: res.data.message };
    }
    throw new Error(res.data.message || "Failed to delete question");
  } catch (err) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to delete question"
    );
  }
};

export const reorderQuestions = async (token, quizId, questionOrders) => {
  try {
    const res = await axios.put(
      `/api/quizzes/${quizId}/reorder-questions`,
      { question_orders: questionOrders },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to reorder questions");
  } catch (err) {
    throw new Error(
      err.response?.data?.message ||
        err.message ||
        "Failed to reorder questions"
    );
  }
};
