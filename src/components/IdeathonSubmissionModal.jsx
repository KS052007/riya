import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaCloudUploadAlt, 
  FaFilePdf, 
  FaFilePowerpoint, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaLock
} from 'react-icons/fa';
import './IdeathonSubmissionModal.css';

const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.ppt', '.pptx'];

export default function IdeathonSubmissionModal({ isOpen, onClose, isDeadlinePassed = false }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validateEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim().toLowerCase());
  };

  const handleFileChange = (file) => {
    setErrorMessage('');
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage('Invalid file format. Please upload a PDF, PPT, or PPTX file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 30 MB limit. Please select a smaller file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.substring(result.indexOf(',') + 1);
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isDeadlinePassed) {
      setErrorMessage('Submissions closed on 9th August at 6:00 PM.');
      return;
    }

    // Frontend Validations
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      setErrorMessage('Please enter a valid student email address.');
      return;
    }
    if (!level) {
      setErrorMessage('Please select your Level (Foundation, Diploma, or Degree).');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Please upload your submission file (PDF, PPT, or PPTX).');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_IDEATHON_SUBMISSION_API_URL || 'https://script.google.com/macros/s/AKfycbzT7Pg3-0mcctFmIP6M5dH94ABlVuxtW9VTvDgzJZD9MJ3_6ASI_O6EIh8ikszW6bMV/exec';
      
      if (!apiUrl) {
        setErrorMessage('Google Apps Script Web App URL is not configured.');
        setIsSubmitting(false);
        return;
      }

      const fileBase64 = await fileToBase64(selectedFile);

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        level: level,
        problemTitle: problemTitle.trim() || 'N/A',
        fileName: selectedFile.name,
        fileDataBase64: fileBase64,
        mimeType: selectedFile.type
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        resetForm();
      } else {
        setErrorMessage(result.error || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage('Submission failed due to a network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setLevel('');
    setProblemTitle('');
    setSelectedFile(null);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage('');
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="modal-card"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-title-group">
              <h2>Ideathon Submission</h2>
              <p className="modal-subtitle">Submit your solution presentation & project details for IRIDESCENT.</p>
            </div>
            <button className="modal-close-btn" onClick={handleClose} aria-label="Close modal">
              <FaTimes />
            </button>
          </div>

          {isSuccess ? (
            <div className="success-view">
              <div className="success-icon-badge">
                <FaCheckCircle />
              </div>
              <h3 className="success-title">Submission Recorded!</h3>
              <p className="success-message">
                Thank you! Your Ideathon proposal has been successfully uploaded to Google Drive and recorded in our submission database.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  className="submit-btn" 
                  onClick={() => setIsSuccess(false)}
                  style={{ padding: '0.75rem 1.5rem', textTransform: 'none' }}
                >
                  Submit Another Idea
                </button>
                <button 
                  className="modal-close-btn" 
                  onClick={handleClose}
                  style={{ width: 'auto', borderRadius: '12px', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.08)' }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="modal-body">
              {isDeadlinePassed && (
                <div className="error-alert" style={{ background: 'rgba(71, 85, 105, 0.2)', borderColor: '#64748b', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaLock /> Submissions closed on 9th August at 6:00 PM.
                </div>
              )}

              {errorMessage && (
                <div className="error-alert">
                  <FaExclamationTriangle style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  {errorMessage}
                </div>
              )}

              {/* Field 1: Name */}
              <div className="form-group">
                <label className="form-label">
                  Name <span className="req">*</span>
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting || isDeadlinePassed}
                  required
                />
              </div>

              {/* Field 2: Student Email ID */}
              <div className="form-group">
                <label className="form-label">
                  Student Email ID <span className="req">*</span>
                </label>
                <input 
                  type="email"
                  className="form-input"
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isDeadlinePassed}
                  required
                />
              </div>

              {/* Field 3: Level Dropdown */}
              <div className="form-group">
                <label className="form-label">
                  Level <span className="req">*</span>
                </label>
                <select 
                  className="form-select"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  disabled={isSubmitting || isDeadlinePassed}
                  required
                >
                  <option value="" disabled>-- Select Academic Level --</option>
                  <option value="Foundation">Foundation</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Degree">Degree</option>
                </select>
              </div>

              {/* Field 4: Problem Title (Optional) */}
              <div className="form-group">
                <label className="form-label">
                  Problem Title
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sustainable E-Waste Recycling Platform"
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  disabled={isSubmitting || isDeadlinePassed}
                />
                <span className="helper-text">Required only if you have chosen the Open Theme.</span>
              </div>

              {/* Field 5: Submission File Upload */}
              <div className="form-group">
                <label className="form-label">
                  Submission File <span className="req">*</span>
                </label>

                {!selectedFile ? (
                  <div 
                    className={`dropzone ${dragActive ? 'active' : ''}`}
                    onDragEnter={isDeadlinePassed ? undefined : handleDrag}
                    onDragLeave={isDeadlinePassed ? undefined : handleDrag}
                    onDragOver={isDeadlinePassed ? undefined : handleDrag}
                    onDrop={isDeadlinePassed ? undefined : handleDrop}
                    onClick={() => !isDeadlinePassed && fileInputRef.current?.click()}
                    style={isDeadlinePassed ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
                  >
                    <FaCloudUploadAlt className="dropzone-icon" />
                    <div className="dropzone-text">
                      {isDeadlinePassed ? 'Submissions closed' : <>Drag & drop your file here, or <span>browse</span></>}
                    </div>
                    <div className="dropzone-limits">
                      Accepted formats: <strong>PDF, PPT, PPTX</strong> (Max size: <strong>30 MB</strong>)
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      style={{ display: 'none' }}
                      onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                      disabled={isSubmitting || isDeadlinePassed}
                    />
                  </div>
                ) : (
                  <div className="file-chip">
                    <div className="file-info">
                      {selectedFile.name.endsWith('.pdf') ? (
                        <FaFilePdf className="file-icon" />
                      ) : (
                        <FaFilePowerpoint className="file-icon" />
                      )}
                      <div>
                        <div className="file-name">{selectedFile.name}</div>
                        <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                      </div>
                    </div>
                    {!isSubmitting && !isDeadlinePassed && (
                      <button 
                        type="button" 
                        className="file-remove"
                        onClick={() => setSelectedFile(null)}
                        title="Remove file"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting || isDeadlinePassed}
                  style={isDeadlinePassed ? { background: '#475569', boxShadow: 'none', cursor: 'not-allowed', opacity: 0.7 } : undefined}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" /> Submitting & Uploading...
                    </>
                  ) : isDeadlinePassed ? (
                    'Submission Closed'
                  ) : (
                    'Submit Idea Proposal'
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
