'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Input, Textarea, Select } from '@/components/ui';
import { 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Send,
  Check,
  ExternalLink,
  BookOpen,
  Mail
} from 'lucide-react';

const supportReasons = [
  { value: '', label: 'Select a reason...' },
  { value: 'bug', label: 'Bug Report - Something isn\'t working correctly' },
  { value: 'feature', label: 'Feature Request - Suggest a new feature' },
  { value: 'account', label: 'Account Issue - Login, permissions, or access problems' },
  { value: 'billing', label: 'Billing Question - Subscription or payment inquiry' },
  { value: 'integration', label: 'Integration Help - Connecting third-party services' },
  { value: 'data', label: 'Data Issue - Missing or incorrect data' },
  { value: 'training', label: 'Training Request - Need help learning the platform' },
  { value: 'other', label: 'Other - General question or feedback' },
];

export default function HelpPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    reason: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason) {
      setError('Please select a reason for your request');
      return;
    }
    if (!formData.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSent(true);
        setFormData(prev => ({ ...prev, reason: '', subject: '', message: '' }));
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600">Get help with 5me or contact our support team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-[#586c96]/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#586c96]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Contact Support</h2>
                <p className="text-sm text-gray-500">We typically respond within 24 hours</p>
              </div>
            </div>

            {sent ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for reaching out. Our team will get back to you soon.
                </p>
                <Button onClick={() => setSent(false)} variant="outline">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reason for Contact <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  >
                    {supportReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please describe your issue or question in detail..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.message.length}/1000 characters
                  </p>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={sending}>
                    {sending ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#586c96]" />
              Quick Help
            </h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#" 
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#586c96]"
                >
                  <FileText className="h-4 w-4" />
                  Getting Started Guide
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#586c96]"
                >
                  <FileText className="h-4 w-4" />
                  Managing Review Sources
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#586c96]"
                >
                  <FileText className="h-4 w-4" />
                  Widget Customization
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#586c96]"
                >
                  <FileText className="h-4 w-4" />
                  Email Notifications Setup
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-[#586c96]/5 border-[#586c96]/20">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#586c96]" />
              Direct Email
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Prefer email? Reach us directly at:
            </p>
            <a 
              href="mailto:support@actuatemedia.com" 
              className="text-[#586c96] font-medium hover:underline"
            >
              support@actuatemedia.com
            </a>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#586c96]" />
              FAQ
            </h3>
            <div className="space-y-3 text-sm">
              <details className="group">
                <summary className="cursor-pointer text-gray-700 hover:text-[#586c96] font-medium">
                  How do I add a new location?
                </summary>
                <p className="mt-2 text-gray-600 pl-4">
                  Navigate to Companies → Select a company → Click "Add Location" button.
                </p>
              </details>
              <details className="group">
                <summary className="cursor-pointer text-gray-700 hover:text-[#586c96] font-medium">
                  How do I set up email notifications?
                </summary>
                <p className="mt-2 text-gray-600 pl-4">
                  Go to Settings → SMTP to configure your email service, then add notification emails to each location.
                </p>
              </details>
              <details className="group">
                <summary className="cursor-pointer text-gray-700 hover:text-[#586c96] font-medium">
                  Can I customize the review page?
                </summary>
                <p className="mt-2 text-gray-600 pl-4">
                  Yes! Each location can have its own logo, colors, and review sources configured.
                </p>
              </details>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
