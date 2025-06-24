import api from '../lib/api';

/**
 * Utility class for handling form submissions with different content types
 */
export class FormSubmissionHandler {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  /**
   * Submit JSON data
   */
  async submitJSON(endpoint, data, options = {}) {
    try {
      const response = await api.post(endpoint, data, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit form data (multipart/form-data)
   */
  async submitFormData(endpoint, formData, options = {}) {
    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...options.headers,
        },
        ...options,
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit URL encoded data
   */
  async submitURLEncoded(endpoint, data, options = {}) {
    try {
      const urlEncodedData = new URLSearchParams(data).toString();
      const response = await api.post(endpoint, urlEncodedData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...options.headers,
        },
        ...options,
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit plain text data
   */
  async submitText(endpoint, text, options = {}) {
    try {
      const response = await api.post(endpoint, text, {
        headers: {
          'Content-Type': 'text/plain',
          ...options.headers,
        },
        ...options,
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit XML data
   */
  async submitXML(endpoint, xmlData, options = {}) {
    try {
      const response = await api.post(endpoint, xmlData, {
        headers: {
          'Content-Type': 'application/xml',
          ...options.headers,
        },
        ...options,
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit binary data
   */
  async submitBinary(endpoint, binaryData, contentType, options = {}) {
    try {
      const response = await api.post(endpoint, binaryData, {
        headers: {
          'Content-Type': contentType,
          ...options.headers,
        },
        ...options,
      });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle successful responses
   */
  handleResponse(response) {
    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * Handle errors
   */
  handleError(error) {
    const errorResponse = {
      success: false,
      message: error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };

    if (error.response?.data?.message) {
      errorResponse.message = error.response.data.message;
    }

    return errorResponse;
  }
}

/**
 * Form validation utilities
 */
export class FormValidator {
  constructor() {
    this.rules = {};
  }

  /**
   * Add validation rule
   */
  addRule(field, validator, message) {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push({ validator, message });
    return this;
  }

  /**
   * Validate form data
   */
  validate(data) {
    const errors = {};
    let isValid = true;

    Object.keys(this.rules).forEach(field => {
      const fieldRules = this.rules[field];
      const fieldValue = data[field];

      fieldRules.forEach(rule => {
        if (!rule.validator(fieldValue, data)) {
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(rule.message);
          isValid = false;
        }
      });
    });

    return { isValid, errors };
  }

  /**
   * Clear all rules
   */
  clearRules() {
    this.rules = {};
    return this;
  }
}

/**
 * Common validation functions
 */
export const validators = {
  required: (value) => value !== null && value !== undefined && value !== '',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  minLength: (min) => (value) => value && value.length >= min,
  maxLength: (max) => (value) => !value || value.length <= max,
  pattern: (regex) => (value) => !value || regex.test(value),
  numeric: (value) => !value || /^\d+$/.test(value),
  alphanumeric: (value) => !value || /^[a-zA-Z0-9]+$/.test(value),
  url: (value) => !value || /^https?:\/\/.+/.test(value),
  fileExtension: (allowedExtensions) => (file) => {
    if (!file) return true;
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    return allowedExtensions.includes(extension);
  },
  fileSize: (maxSize) => (file) => {
    if (!file) return true;
    return file.size <= maxSize;
  },
};

/**
 * File upload utilities
 */
export class FileUploadUtils {
  /**
   * Convert file to base64
   */
  static fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename) {
    return '.' + filename.split('.').pop().toLowerCase();
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file type
   */
  static validateFileType(file, allowedTypes) {
    const extension = this.getFileExtension(file.name);
    return allowedTypes.includes(extension);
  }

  /**
   * Create FormData from object
   */
  static createFormData(data, files = {}) {
    const formData = new FormData();
    
    // Add regular data
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    // Add files
    Object.keys(files).forEach(key => {
      const file = files[key];
      if (file instanceof File) {
        formData.append(key, file);
      } else if (Array.isArray(file)) {
        file.forEach((f, index) => {
          if (f instanceof File) {
            formData.append(`${key}[${index}]`, f);
          }
        });
      }
    });
    
    return formData;
  }
}

/**
 * URL utilities
 */
export class URLUtils {
  /**
   * Build query string from object
   */
  static buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        searchParams.append(key, params[key]);
      }
    });
    return searchParams.toString();
  }

  /**
   * Parse query string to object
   */
  static parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Build URL with query parameters
   */
  static buildURL(baseURL, params = {}) {
    const queryString = this.buildQueryString(params);
    return queryString ? `${baseURL}?${queryString}` : baseURL;
  }
}

// Create default instances
export const formHandler = new FormSubmissionHandler();
export const formValidator = new FormValidator();

// Export default form submission handler
export default formHandler;