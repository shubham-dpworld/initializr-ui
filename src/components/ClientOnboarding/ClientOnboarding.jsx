import React, { useState } from 'react';
import './ClientOnboarding.css';

const ClientOnboarding = () => {
  const [formData, setFormData] = useState({
    curlCommand: '',
    expectedResponse: '',
    integrationName: '',
    description: '',
    basePackage: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [responseData, setResponseData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('YOUR_BACKEND_ENDPOINT_HERE', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setResponseData(data);
        setSubmitStatus('success');

        // Reset form
        setFormData({
          curlCommand: '',
          expectedResponse: '',
          integrationName: '',
          description: '',
          basePackage: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="client-onboarding-container">
      <div className="onboarding-header">
        <h1>Client API Onboarding</h1>
        <p>Submit your API integration details for onboarding</p>
      </div>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-group">
          <label htmlFor="integrationName">Integration Name *</label>
          <input
            type="text"
            id="integrationName"
            name="integrationName"
            value={formData.integrationName}
            onChange={handleInputChange}
            placeholder="e.g., user-service"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="e.g., User API Integration"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="basePackage">Base Package *</label>
          <input
            type="text"
            id="basePackage"
            name="basePackage"
            value={formData.basePackage}
            onChange={handleInputChange}
            placeholder="e.g., com.example.integration"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="curlCommand">cURL Command *</label>
          <textarea
            id="curlCommand"
            name="curlCommand"
            value={formData.curlCommand}
            onChange={handleInputChange}
            placeholder="curl 'https://api.example.com/users/1' -H 'Authorization: Bearer token123'"
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="expectedResponse">Expected Response *</label>
          <textarea
            id="expectedResponse"
            name="expectedResponse"
            value={formData.expectedResponse}
            onChange={handleInputChange}
            placeholder='{"id": 1, "name": "John Doe", "email": "john@example.com"}'
            rows="4"
            required
          />
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Onboarding'}
        </button>
      </form>

      {submitStatus === 'success' && (
        <div className="success-message">
          <div className="message-icon">✓</div>
          <h3>API Submitted Successfully!</h3>
          <p>Your API integration has been submitted for onboarding and will reflect on the UI soon after verification.</p>

          {responseData && (
            <div className="response-details">
              <h4>Integration Details:</h4>
              <div className="detail-item">
                <strong>Integration ID:</strong> {responseData.integrationId}
              </div>
              <div className="detail-item">
                <strong>Integration Name:</strong> {responseData.integrationName}
              </div>
              <div className="detail-item">
                <strong>Storage Path:</strong> {responseData.storagePath}
              </div>
            </div>
          )}
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="error-message">
          <div className="message-icon">✕</div>
          <h3>Submission Failed</h3>
          <p>There was an error submitting your API integration. Please try again.</p>
        </div>
      )}
    </div>
  );
};

export default ClientOnboarding;
