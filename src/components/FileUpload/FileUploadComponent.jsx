
import React, { useState, useRef } from 'react';
import { fileAPI } from '../../lib/api';
import './FileUpload.css';

const FileUploadComponent = ({
  onUploadSuccess,
  onUploadError,
  multiple = false,
  acceptedTypes = [],
  maxFileSize = 100 * 1024 * 1024, // 100MB to match Cloudinary video limit
  className = '',
  children,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [allowedTypes, setAllowedTypes] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch allowed file types from backend
  React.useEffect(() => {
    const fetchAllowedTypes = async () => {
      try {
        const response = await fileAPI.getAllowedTypes();
        if (response.data.success) {
          setAllowedTypes(response.data.data.allowedExtensions);
        }
      } catch (error) {
        console.error('Failed to fetch allowed file types:', error);
      }
    };
    fetchAllowedTypes();
  }, []);

  // Validate file before upload
  const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`);
    }
    
    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    // If acceptedTypes is provided and not empty, use it; otherwise use allowedTypes from server
    let isAllowedType = false;
    if (acceptedTypes.length > 0) {
      // Use specific accepted types passed as prop
      isAllowedType = acceptedTypes.includes(fileExtension);
    } else {
      // Use server-provided allowed types (fallback to true if not loaded yet)
      isAllowedType = allowedTypes.length === 0 || allowedTypes.includes(fileExtension);
    }
    
    if (!isAllowedType) {
      errors.push(`File type ${fileExtension} is not allowed`);
    }
    
    return errors;
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Validate all files first
      const validationErrors = [];
      Array.from(files).forEach((file, index) => {
        const errors = validateFile(file);
        if (errors.length > 0) {
          validationErrors.push(`File ${index + 1} (${file.name}): ${errors.join(', ')}`);
        }
      });
      
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }
      
      let response;
      
      if (multiple && files.length > 1) {
        // Multiple file upload
        response = await fileAPI.uploadMultipleFiles(
          Array.from(files),
          (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        );
      } else {
        // Single file upload
        response = await fileAPI.uploadFile(
          files[0],
          (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        );
      }
      
      if (response.success) {
        onUploadSuccess?.(response.data);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const acceptAttribute = acceptedTypes.length > 0 
    ? acceptedTypes.join(',')
    : allowedTypes.join(',');

  return (
    <div className={`file-upload-component ${className}`}>
      <div
        className={`file-upload-area ${
          dragActive ? 'drag-active' : ''
        } ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptAttribute}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          children || (
            <div className="upload-placeholder">
              <div className="upload-icon">📁</div>
              <p>Click to upload or drag and drop files here</p>
              <p className="upload-hint">
                {acceptedTypes.length > 0 
                  ? `Accepted: ${acceptedTypes.join(', ')}`
                  : `Max size: ${Math.round(maxFileSize / (1024 * 1024))}MB`
                }
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FileUploadComponent;