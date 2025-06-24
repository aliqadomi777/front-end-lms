

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  authAPI, 
  userAPI, 
  courseAPI, 
  moduleAPI, 
  lessonAPI, 
  enrollmentAPI, 
  quizAPI, 
  assignmentAPI, 
  notificationAPI, 
  reviewAPI 
} from '@/lib/api';
import { toast } from 'sonner';

// Query keys for consistent cache management
export const queryKeys = {
  auth: ['auth'],
  users: ['users'],
  courses: ['courses'],
  modules: ['modules'],
  lessons: ['lessons'],
  enrollments: ['enrollments'],
  quizzes: ['quizzes'],
  assignments: ['assignments'],
  notifications: ['notifications'],
  reviews: ['reviews'],
};

// Auth hooks
// User hooks
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.users, params],
    queryFn: () => userAPI.getUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: [...queryKeys.users, id],
    queryFn: () => userAPI.getUser(id),
    enabled: !!id,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, role }) => userAPI.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User role updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId) => userAPI.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await authAPI.login(payload);
      return res.data;
    },
   
    onSuccess: (response) => {

      if (!response?.tokens?.access || !response?.user) {
        console.warn('Login response missing user data:', response);
        return;
      }
      
      localStorage.setItem("accessToken", response.tokens.access);
      localStorage.setItem("refreshToken", response.tokens.refresh);
    
      queryClient.setQueryData(queryKeys.auth, response.user);
    
      toast.success("Login successful!");
    },
    
    
    

    
    onError: (error) => {
      console.error('useLogin onError:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      const tokenKey = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'authToken';
      localStorage.removeItem(tokenKey);
      queryClient.clear();
      toast.success('Logged out successfully');
    },
  });
};

// Course hooks
export const useCourses = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.courses, params],
    queryFn: () => courseAPI.getCourses(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useApprovedCourses = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.courses, 'approved', params],
    queryFn: () => courseAPI.getApprovedCourses(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCourse = (id) => {
  return useQuery({
    queryKey: [...queryKeys.courses, id],
    queryFn: () => courseAPI.getCourse(id),
    enabled: !!id,
  });
};

export const useEnrolledCourses = () => {
  const token = localStorage.getItem('accessToken');
  return useQuery({
    queryKey: [...queryKeys.courses, 'enrolled'],
    queryFn: courseAPI.getEnrolledCourses,
    enabled: !!token, // Only run when authenticated
  });
};

export const useInstructorCourses = () => {
  return useQuery({
    queryKey: [...queryKeys.courses, 'instructor'],
    queryFn: courseAPI.getInstructorCourses,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: courseAPI.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses });
      toast.success('Course created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create course');
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => courseAPI.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses });
      toast.success('Course updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update course');
    },
  });
};

// Enrollment hooks
export const useEnrollments = () => {
  return useQuery({
    queryKey: queryKeys.enrollments,
    queryFn: enrollmentAPI.getEnrollments,
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: enrollmentAPI.enrollCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.courses, 'enrolled'] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.courses, 'approved'] });
      toast.success('Successfully enrolled in course!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to enroll in course');
    },
  });
};

// Course approval hooks
export const usePendingCourses = (options = {}) => {
  return useQuery({
    queryKey: [...queryKeys.courses, 'pending'],
    queryFn: courseAPI.getPendingCourses,
    ...options // This allows passing enabled: false from the component
  });
};

export const useApproveCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, action }) => courseAPI.approveCourse(id, action),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.courses, 'pending'] });
      toast.success(`Course ${variables.action}d successfully!`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to process course approval');
    },
  });
};

export const useUnenrollCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: enrollmentAPI.unenrollCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.courses, 'enrolled'] });
      toast.success('Successfully unenrolled from course');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unenroll from course');
    },
  });
};

export const useEnrollmentProgress = (courseId) => {
  return useQuery({
    queryKey: [...queryKeys.enrollments, 'progress', courseId],
    queryFn: () => enrollmentAPI.getEnrollmentProgress(courseId),
    enabled: !!courseId,
  });
};

// Module hooks
export const useModules = (courseId) => {
  return useQuery({
    queryKey: [...queryKeys.modules, courseId],
    queryFn: () => moduleAPI.getModules(courseId),
    enabled: !!courseId,
  });
};

export const useModule = (id) => {
  return useQuery({
    queryKey: [...queryKeys.modules, id],
    queryFn: () => moduleAPI.getModule(id),
    enabled: !!id,
  });
};

// Lesson hooks
export const useLessons = (moduleId) => {
  return useQuery({
    queryKey: [...queryKeys.lessons, moduleId],
    queryFn: () => lessonAPI.getLessons(moduleId),
    enabled: !!moduleId,
  });
};

export const useLessonsByCourse = (courseId) => {
  return useQuery({
    queryKey: [...queryKeys.lessons, 'course', courseId],
    queryFn: () => lessonAPI.getLessonsByCourse(courseId),
    enabled: !!courseId,
  });
};

export const useLesson = (id) => {
  return useQuery({
    queryKey: [...queryKeys.lessons, id],
    queryFn: () => lessonAPI.getLesson(id),
    enabled: !!id,
  });
};

export const useMarkLessonComplete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: lessonAPI.markComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments });
      toast.success('Lesson marked as complete!');
    },
  });
};

// Quiz hooks
export const useQuizzes = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.quizzes, params],
    queryFn: () => quizAPI.getQuizzes(params),
  });
};

export const useQuiz = (id) => {
  return useQuery({
    queryKey: [...queryKeys.quizzes, id],
    queryFn: () => quizAPI.getQuiz(id),
    enabled: !!id,
  });
};

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, answers }) => quizAPI.submitQuiz(id, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
      toast.success('Quiz submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    },
  });
};

// Assignment hooks
export const useAssignments = (params = {}) => {
  const { courseId, ...otherParams } = params;
  
  return useQuery({
    queryKey: [...queryKeys.assignments, params],
    queryFn: () => {
      if (courseId) {
        return assignmentAPI.getAssignmentsByCourse(courseId);
      }
      return assignmentAPI.getAssignments(otherParams);
    },
    enabled: courseId ? !!courseId : true,
  });
};

export const useAssignment = (id) => {
  return useQuery({
    queryKey: [...queryKeys.assignments, id],
    queryFn: () => assignmentAPI.getAssignment(id),
    enabled: !!id,
  });
};

// Notification hooks
export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationAPI.getNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};

// Review hooks
export const useReviews = (courseId) => {
  return useQuery({
    queryKey: [...queryKeys.reviews, courseId],
    queryFn: () => reviewAPI.getReviews(courseId),
    enabled: !!courseId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reviewAPI.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews });
      toast.success('Review submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData) => {
      const res = await authAPI.register(userData);
      return res.data;
    },
    onSuccess: (response) => {
      toast.success("Account created successfully! Please log in.");
    },
    onError: (error) => {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });
};
