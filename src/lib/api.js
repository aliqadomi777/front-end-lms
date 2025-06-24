import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Don't add token to login/register requests
    const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
    
    if (!isAuthRequest) {
      // Use consistent token key
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const hasLsToken = !!localStorage.getItem('accessToken');
      const hasAuthCookie = document.cookie.includes('accessToken=');

      // ---------- silent refresh pattern ----------
      if (hasAuthCookie && !hasLsToken) {
        try {
          const { data } = await api.post('/auth/refresh');
          localStorage.setItem('accessToken', data.tokens.access);
          error.config.headers.Authorization = `Bearer ${data.tokens.access}`;
          return api(error.config);        // ➜ retry original request
        } catch (_) {/* fall through to full logout */}
      }

      // ---------- hard logout ----------
      // Only logout when both cookies + LS token fail
      if (!hasAuthCookie && !hasLsToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Prevent infinite redirects by checking current location
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  refreshToken: () => api.post('/auth/refresh'),
};

// User API endpoints
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Course API endpoints
export const courseAPI = {
  getCourses: (params) => api.get('/courses', { params }),
  getApprovedCourses: (params) => api.get('/courses/approved', { params }),
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getEnrolledCourses: () => api.get('/courses/enrolled'),
  getInstructorCourses: () => api.get('/courses/instructor'),
  publishCourse: (id) => api.put(`/courses/${id}/publish`),
  unpublishCourse: (id) => api.put(`/courses/${id}/unpublish`),
  enrollCourse: (courseId) => api.post('/enrollments', { course_id: courseId }),
  unenrollCourse: (courseId) => api.delete(`/enrollments/${courseId}`),
  approveCourse: (id, action) => api.put(`/courses/${id}/approve`, { action }),
  getPendingCourses: () => api.get('/courses/pending')
};

// Module API endpoints
export const moduleAPI = {
  getModules: (courseId) => api.get(`/modules/course/${courseId}`),
  getModule: (id) => api.get(`/modules/${id}`),
  createModule: (data) => api.post('/modules', data),
  updateModule: (id, data) => api.put(`/modules/${id}`, data),
  deleteModule: (id) => api.delete(`/modules/${id}`),
};

// Lesson API endpoints
export const lessonAPI = {
  getLessons: (moduleId) => api.get(`/lessons/module/${moduleId}`),
  getLessonsByCourse: (courseId) => api.get(`/lessons/course/${courseId}`),
  getLesson: (id) => api.get(`/lessons/${id}`),
  createLesson: (data) => api.post('/lessons', data),
  updateLesson: (id, data) => api.put(`/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  markComplete: (id) => api.post(`/lessons/${id}/complete`),
};

// Enrollment API endpoints
export const enrollmentAPI = {
  enrollCourse: (courseId) => api.post('/enrollments', { course_id: courseId }), // Changed from { courseId }
  unenrollCourse: (courseId) => api.delete(`/enrollments/${courseId}`),
  getEnrollments: () => api.get('/enrollments'),
  getEnrollmentProgress: (courseId) => api.get(`/enrollments/${courseId}/progress`),
};

// Quiz API endpoints
export const quizAPI = {
  getQuizzes: (params) => api.get('/quizzes', { params }),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  getQuizzesByLesson: (lessonId) => api.get(`/quizzes/lesson/${lessonId}`),
  getQuizzesByCourse: (courseId) => api.get(`/quizzes/course/${courseId}`),
  createQuiz: (data) => api.post('/quizzes', data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
  publishQuiz: (id) => api.put(`/quizzes/${id}/publish`),
  unpublishQuiz: (id) => api.put(`/quizzes/${id}/unpublish`),
  
  // Question management
  addQuestion: (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data),
  updateQuestion: (questionId, data) => api.put(`/quizzes/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/quizzes/questions/${questionId}`),
  
  // Quiz attempts
  submitQuiz: (id, data) => api.post(`/quizzes/${id}/attempts`, data),
  getQuizAttempts: (quizId) => api.get(`/quizzes/${quizId}/attempts`),
  getUserQuizAttempts: (userId) => api.get(`/quizzes/attempts/user/${userId}`),
  getQuizStatistics: (quizId) => api.get(`/quizzes/${quizId}/statistics`),
};

// Assignment API endpoints
export const assignmentAPI = {
  getAssignments: (params) => api.get('/assignments', { params }),
  getAssignment: (id) => api.get(`/assignments/${id}`),
  getAssignmentsByLesson: (lessonId) => api.get(`/assignments/lesson/${lessonId}`),
  getAssignmentsByCourse: (courseId) => api.get(`/assignments/course/${courseId}`),
  createAssignment: (data) => api.post('/assignments', data),
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  publishAssignment: (id) => api.put(`/assignments/${id}/publish`),
  unpublishAssignment: (id) => api.put(`/assignments/${id}/unpublish`),
  
  // Assignment submissions
  submitAssignment: (assignmentId, data) => api.post(`/assignments/${assignmentId}/submit`, data),
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  getUserSubmissions: (userId) => api.get(`/assignments/submissions/user/${userId}`),
  gradeSubmission: (submissionId, data) => api.put(`/assignments/submissions/${submissionId}/grade`, data),
  
  // Assignment management
  getAssignmentsDueSoon: () => api.get('/assignments/due-soon'),
  getOverdueAssignments: () => api.get('/assignments/overdue'),
  getPendingSubmissions: (courseId) => api.get(`/assignments/course/${courseId}/pending-submissions`),
  getAssignmentStatistics: (assignmentId) => api.get(`/assignments/${assignmentId}/statistics`),
};

// Notification API endpoints
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Review API endpoints
export const reviewAPI = {
  getReviews: (courseId) => api.get(`/reviews?courseId=${courseId}`),
  createReview: (data) => api.post('/reviews', data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

// File Upload API endpoints
export const fileAPI = {
  getAllowedTypes: () => api.get('/files/allowed-types'),
  
  uploadFile: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  
  uploadMultipleFiles: (files, onUploadProgress) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    return api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  
  deleteFile: (fileUrl, publicId) => api.delete('/files/delete', { data: { fileUrl, publicId } }),
};

export default api;

