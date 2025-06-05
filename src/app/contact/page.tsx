'use client';

import { useState } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { ChevronDown, Phone, Mail, Send, CheckCircle2, AlertTriangle, Clock, HeadphonesIcon, MessageCircle, Building, Zap, Lightbulb } from 'lucide-react';
import Link from 'next/link';

const CONTACT_SUBJECTS = [
  { value: 'General Inquiry', label: 'General Inquiry', icon: '💬', description: 'General questions about TutorJi' },
  { value: 'Technical Support', label: 'Technical Support', icon: '🔧', description: 'Help with technical issues' },
  { value: 'Account Issue', label: 'Account Issue', icon: '👤', description: 'Problems with your account' },
  { value: 'Billing Question', label: 'Billing Question', icon: '💳', description: 'Payment and subscription queries' },
  { value: 'Feature Request', label: 'Feature Request', icon: '🚀', description: 'Suggest new features' },
  { value: 'Bug Report', label: 'Bug Report', icon: '🐛', description: 'Report software bugs' },
  { value: 'Partnership', label: 'Partnership', icon: '🤝', description: 'Business partnerships' },
  { value: 'Press & Media', label: 'Press & Media', icon: '📰', description: 'Media inquiries' },
  { value: 'Other', label: 'Other', icon: '📝', description: 'Something else' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
    company: '',
    isUrgent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    estimatedResponse?: string;
  }>({ type: null, message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubjectSelect = (subject: string) => {
    setFormData(prev => ({ ...prev, subject }));
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setSubmitStatus({ type: null, message: '' });
    
    // Basic client-side validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject || !formData.message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Name, email, subject, and message are required.',
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
      const response = await fetch('/api/contact', {
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
          message: 'Thank you! Your message has been sent successfully.',
          estimatedResponse: data.estimatedResponse,
        });
        // Reset form
        setFormData({ 
          name: '', 
          email: '', 
          subject: '', 
          message: '', 
          phone: '', 
          company: '', 
          isUrgent: false 
        });
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

  const selectedSubject = CONTACT_SUBJECTS.find(subject => subject.value === formData.subject);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <HeadphonesIcon className="w-4 h-4" />
              Get in touch with us
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contact{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                TutorJi
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Have questions, need support, or want to discuss partnerships? We're here to help and would love to hear from you.
            </p>

            {/* Contact Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Quick Response</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 2-3 working days, urgent matters within 24-48 hours.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Direct Email</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reach us directly at{' '}
                  <a href="mailto:support@tutorji.in" className="text-primary hover:underline">
                    support@tutorji.in
                  </a>
                </p>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <HeadphonesIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Expert Support</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our team of experts is ready to assist with any questions or technical issues.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Direct Contact Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Direct Email Contact
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    If you prefer email, you can reach us directly at:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="mailto:support@tutorji.in"
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <Mail className="w-4 h-4" />
                      support@tutorji.in
                    </a>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Expected response time: 2-3 working days
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestions Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Have a suggestion or feature request?
                  </h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                    If you have ideas for new features, improvements, or feedback to help us make TutorJi better, we'd love to hear from you!
                  </p>
                  <Link
                    href="/suggest"
                    className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 bg-purple-100 dark:bg-purple-800/50 px-3 py-2 rounded-md transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Share Your Ideas
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border rounded-xl shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      maxLength={100}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Enter your full name"
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

                {/* Phone and Company Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength={20}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="+1 (555) 123-4567"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-2">
                      Company (Optional)
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      maxLength={100}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Your company name"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Subject Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subject *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all flex items-center justify-between"
                    >
                      {selectedSubject ? (
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{selectedSubject.icon}</span>
                          <div>
                            <div className="font-medium">{selectedSubject.label}</div>
                            <div className="text-xs text-muted-foreground">{selectedSubject.description}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select a subject...</span>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {CONTACT_SUBJECTS.map((subject) => (
                          <button
                            key={subject.value}
                            type="button"
                            onClick={() => handleSubjectSelect(subject.value)}
                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                          >
                            <span className="text-lg">{subject.icon}</span>
                            <div>
                              <div className="font-medium">{subject.label}</div>
                              <div className="text-xs text-muted-foreground">{subject.description}</div>
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
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-vertical"
                    placeholder="Tell us how we can help you. Please be as detailed as possible..."
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                      Include any relevant details to help us assist you better
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.message.length}/2000
                    </p>
                  </div>
                </div>

                {/* Urgent Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="isUrgent"
                    name="isUrgent"
                    checked={formData.isUrgent}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <div>
                    <label htmlFor="isUrgent" className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      This is urgent (24-48 hour response)
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check this box if your issue requires immediate attention
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
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
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
                        {submitStatus.type === 'success' ? 'Message Sent!' : 'Error'}
                      </p>
                      <p className={`text-sm ${
                        submitStatus.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        {submitStatus.message}
                      </p>
                      {submitStatus.type === 'success' && submitStatus.estimatedResponse && (
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                          Expected response time: {submitStatus.estimatedResponse}
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
                We value your privacy and will never share your information with third parties. 
                All communications are secure and confidential.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 