'use client';

import { useState } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { ChevronDown, Lightbulb, MessageSquare, Star, Clock, Phone, Mail, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

const SUGGESTION_TOPICS = [
  { value: 'Feature Request', label: 'Feature Request', icon: '🚀', description: 'New features or enhancements' },
  { value: 'Bug Report', label: 'Bug Report', icon: '🐛', description: 'Report issues or errors' },
  { value: 'User Experience', label: 'User Experience', icon: '✨', description: 'Improve interface and usability' },
  { value: 'Performance', label: 'Performance', icon: '⚡', description: 'Speed and optimization improvements' },
  { value: 'Content Quality', label: 'Content Quality', icon: '📚', description: 'Educational content improvements' },
  { value: 'Mobile App', label: 'Mobile App', icon: '📱', description: 'Mobile experience enhancements' },
  { value: 'Accessibility', label: 'Accessibility', icon: '♿', description: 'Make platform more accessible' },
  { value: 'Integration', label: 'Integration', icon: '🔗', description: 'Third-party integrations' },
  { value: 'General Feedback', label: 'General Feedback', icon: '💭', description: 'Overall thoughts and ideas' },
  { value: 'Other', label: 'Other', icon: '📝', description: 'Something else entirely' },
];

export default function SuggestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTopicSelect = (topic: string) => {
    setFormData(prev => ({ ...prev, topic }));
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setSubmitStatus({ type: null, message: '' });
    
    // Basic client-side validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.topic || !formData.message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'All fields are required.',
      });
      return;
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you! Your suggestion has been submitted successfully.',
        });
        // Reset form
        setFormData({ name: '', email: '', topic: '', message: '' });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTopic = SUGGESTION_TOPICS.find(topic => topic.value === formData.topic);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Lightbulb className="w-4 h-4" />
              Help us improve TutorJi
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Share Your{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Ideas
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Your feedback shapes the future of TutorJi. Help us build the best AI-powered learning platform together.
            </p>

            {/* Priority Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold">We Listen</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Every suggestion is reviewed by our team and considered for development.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Popular First</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We prioritize features and fixes based on user demand and impact.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Quick Response</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We typically respond to suggestions within 24-48 hours.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Urgent Contact Banner */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                    Need Urgent Help?
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                    For urgent issues, technical problems, or immediate assistance, please contact us directly:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="mailto:support@tutorji.in"
                      className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100"
                    >
                      <Mail className="w-4 h-4" />
                      support@tutorji.in
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestion Form */}
            <div className="bg-card border rounded-xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      maxLength={100}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Enter your name"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="your@email.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Topic Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Suggestion Topic *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all flex items-center justify-between"
                    >
                      {selectedTopic ? (
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{selectedTopic.icon}</span>
                          <div>
                            <div className="font-medium">{selectedTopic.label}</div>
                            <div className="text-xs text-muted-foreground">{selectedTopic.description}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select a topic...</span>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {SUGGESTION_TOPICS.map((topic) => (
                          <button
                            key={topic.value}
                            type="button"
                            onClick={() => handleTopicSelect(topic.value)}
                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                          >
                            <span className="text-lg">{topic.icon}</span>
                            <div>
                              <div className="font-medium">{topic.label}</div>
                              <div className="text-xs text-muted-foreground">{topic.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Your Suggestion *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-vertical"
                    placeholder="Describe your suggestion in detail. The more specific you are, the better we can understand and implement your idea..."
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                      Be specific and detailed to help us understand your needs better
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.message.length}/1000
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Suggestion
                    </>
                  )}
                </button>
              </form>

              {/* Status Messages */}
              {submitStatus.type && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {submitStatus.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        submitStatus.type === 'success' ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                      }`}>
                        {submitStatus.type === 'success' ? 'Success!' : 'Error'}
                      </p>
                      <p className={`text-sm ${
                        submitStatus.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        {submitStatus.message}
                      </p>
                      {submitStatus.type === 'success' && (
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                          We'll review your suggestion and get back to you soon. Thank you for helping us improve!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Your suggestions help shape the future of TutorJi. We read every submission and prioritize 
                based on community interest and technical feasibility.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 