// Course validation utilities

/**
 * Check if a course ID is valid (basic format validation)
 * @param {string|number} courseId - The course ID to validate
 * @returns {boolean} - True if the course ID is a valid number
 */
export const isValidCourseId = (courseId) => {
  const id = parseInt(courseId, 10);
  return !isNaN(id) && id > 0;
};

/**
 * Get a list of all valid course IDs (deprecated - use server API instead)
 * @returns {number[]} - Empty array (use server API to get actual courses)
 */
export const getValidCourseIds = () => {
  console.warn('getValidCourseIds is deprecated. Use server API to get actual courses.');
  return [];
};

/**
 * Validate course ID and redirect if invalid
 * @param {string|number} courseId - The course ID to validate
 * @param {function} navigate - React Router navigate function
 * @returns {boolean} - True if valid, false if redirected
 */
export const validateCourseIdOrRedirect = (courseId, navigate) => {
  if (!isValidCourseId(courseId)) {
    // Silently redirect to avoid console noise
    navigate('/courses');
    return false;
  }
  return true;
};

/**
 * Get the first valid course ID (deprecated - use server API instead)
 * @returns {number} - Returns 1 as fallback
 */
export const getFirstValidCourseId = () => {
  console.warn('getFirstValidCourseId is deprecated. Use server API to get actual courses.');
  return 1;
};