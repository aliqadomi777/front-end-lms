import React, { useState } from 'react';
import FileUploadComponent from './FileUploadComponent';
import { formHandler, formValidator, validators, FileUploadUtils } from '../../utils/formUtils';
import { fileAPI } from '../../lib/api';

const FileUploadExample = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Setup form validation
  const validator = formValidator
    .clearRules()
    .addRule('title', validators.required, 'Title is required')
    .addRule('title', validators.minLength(3), 'Title must be at least 3 characters')
    .addRule('description', validators.required, 'Description is required')
    .addRule('category', validators.required, 'Category is required');

  // Handle file upload success
  const handleUploadSuccess = (uploadResult) => {
    
    
    if (uploadResult.files) {
      // Multiple files
      setUploadedFiles(prev => [...prev, ...uploadResult.files]);
    } else {
      // Single file
      setUploadedFiles(prev => [...prev, uploadResult]);
    }
  };

  // Handle file upload error
  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
    alert(`Upload failed: ${error}`);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validator.validate(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setSubmitting(true);
    setErrors({});
    
    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        files: uploadedFiles.map(file => ({
          url: file.fileUrl,
          type: file.fileType,
          name: file.fileName,
          size: file.fileSize,
          extension: file.fileExtension,
          publicId: file.cloudinaryPublicId,
        }))
      };
      
      // Submit as JSON
      const result = await formHandler.submitJSON('/api/content/create', submissionData);
      
      if (result.success) {
        alert('Content created successfully!');
        // Reset form
        setFormData({ title: '', description: '', category: '' });
        setUploadedFiles([]);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert(`Submission failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (fileIndex) => {
    const file = uploadedFiles[fileIndex];
    
    try {
      await fileAPI.deleteFile(file.fileUrl, file.cloudinaryPublicId);
      setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex));
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="file-upload-example" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>File Upload and Form Submission Example</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Form Fields */}
        <div>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: errors.title ? '2px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
          {errors.title && (
            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.title.join(', ')}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: errors.description ? '2px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
          {errors.description && (
            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.description.join(', ')}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="category" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: errors.category ? '2px solid #ef4444' : '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          >
            <option value="">Select a category</option>
            <option value="document">Document</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="other">Other</option>
          </select>
          {errors.category && (
            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.category.join(', ')}
            </div>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Upload Files
          </label>
          <FileUploadComponent
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            multiple={true}
            acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.mp4', '.mp3']}
          />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div>
            <h3>Uploaded Files:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{file.fileName}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {file.fileExtension} • {FileUploadUtils.formatFileSize(file.fileSize)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(index)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: submitting ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default FileUploadExample;