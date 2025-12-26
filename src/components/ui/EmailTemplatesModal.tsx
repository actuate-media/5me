'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { Copy, Download, Eye, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: {
    name: string;
    slug: string;
    logo?: string;
  };
  location?: {
    name: string;
    slug: string;
  };
}

type TabType = 'initial' | 'followup' | 'final';

const tabs: { id: TabType; label: string }[] = [
  { id: 'initial', label: 'Initial Email' },
  { id: 'followup', label: 'Follow Up Email' },
  { id: 'final', label: 'Final Email' },
];

export function EmailTemplatesModal({ isOpen, onClose, company, location }: EmailTemplatesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('initial');
  const [copied, setCopied] = useState(false);

  const reviewUrl = location 
    ? `https://5me.io/reviews/${company.slug}/${location.slug}`
    : `https://5me.io/reviews/${company.slug}`;

  const logoUrl = company.logo || 'https://5me.io/wp-content/uploads/2025/10/placeholder-logo.png';

  const getTemplate = (type: TabType): string => {
    const templates = {
      initial: generateInitialEmail(company.name, logoUrl, reviewUrl),
      followup: generateFollowupEmail(company.name, logoUrl, reviewUrl),
      final: generateFinalEmail(company.name, logoUrl, reviewUrl),
    };
    return templates[type];
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getTemplate(activeTab));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const template = getTemplate(activeTab);
    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-template-${activeTab}-${company.slug}${location ? `-${location.slug}` : ''}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreview = () => {
    const template = getTemplate(activeTab);
    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Templates" size="lg">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleCopy} className="flex items-center gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload} className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button size="sm" variant="outline" onClick={handlePreview} className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>

        {/* Code Display */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <pre className="p-4 text-xs text-gray-300 overflow-x-auto max-h-[400px] overflow-y-auto">
            <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(getTemplate(activeTab)) }} />
          </pre>
        </div>

        {/* Template Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Company:</strong> {company.name}</p>
          {location && <p><strong>Location:</strong> {location.name}</p>}
          <p><strong>Review URL:</strong> {reviewUrl}</p>
          <p><strong>Merge Field:</strong> {'{{contact.name}}'} - Replace with customer name in your ESP</p>
        </div>
      </div>
    </Modal>
  );
}

// Simple syntax highlighting for HTML
function syntaxHighlight(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Tags
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="text-pink-400">$2</span>')
    // Attributes
    .replace(/(\s)([\w-]+)(=)/g, '$1<span class="text-yellow-300">$2</span>$3')
    // Attribute values
    .replace(/(=)(&quot;|")(.*?)(&quot;|")/g, '$1<span class="text-green-400">"$3"</span>')
    // Comments
    .replace(/(&lt;!--.*?--&gt;)/g, '<span class="text-gray-500">$1</span>');
}

// ============================================================================
// Email Template Generators
// ============================================================================

function generateInitialEmail(companyName: string, logoUrl: string, reviewUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>We'd Love Your Feedback</title>
    
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse:collapse;border-spacing:0;margin:0;}
        div, td {padding:0;}
        div {margin:0 !important;}
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    
    <style type="text/css">
        /* Reset */
        body, table, td, a {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;}
        table, td {mso-table-lspace:0pt; mso-table-rspace:0pt;}
        img {-ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none;}
        body {height:100% !important; margin:0 !important; padding:0 !important; width:100% !important;}
        
        /* Button */
        .cta-btn {
            display:inline-block;
            padding:16px 36px;
            font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size:16px;
            font-weight:bold;
            color:#ffffff;
            text-decoration:none;
            border-radius:50px;
            background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow:0 4px 15px 0 rgba(102, 126, 234, 0.4);
        }
        
        .cta-cell {
            border-radius:50px;
            background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Mobile */
        @media screen and (max-width:600px) {
            .container {width:100% !important; max-width:100% !important;}
            .mobile-padding {padding:20px !important;}
            h1 {font-size:28px !important; line-height:36px !important;}
            .cta-btn {display:block !important; padding:18px !important;}
            .star {width:40px !important; height:40px !important; margin:0 3px !important;}
        }
        
        /* Dark Mode */
        @media (prefers-color-scheme:dark) {
            .dark-mode-text {color:#ffffff !important;}
            .dark-mode-subtext {color:#cccccc !important;}
        }
    </style>
</head>

<body style="margin:0; padding:0; background-color:#f4f4f4;">
    <div role="article" aria-roledescription="email" lang="en">
        
        <!-- Preheader -->
        <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
            Your feedback helps us serve you better. Take a moment to share your thoughts...
        </div>
        
        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="border-collapse:collapse;">
            <tr>
                <td align="center" style="padding:20px 0;">
                    
                    <!-- Main Content Card -->
                    <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        
                        <!-- Logo -->
                        <tr>
                            <td align="center" style="padding:40px 20px 30px 20px;">
                                <img src="${logoUrl}" alt="${companyName}" width="200" style="display:block; width:200px; max-width:100%; height:auto;">
                            </td>
                        </tr>
                        
                        <!-- Headline -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px;" class="mobile-padding">
                                <h1 style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:32px; font-weight:bold; color:#333333; line-height:40px;" class="dark-mode-text">
                                    We'd Love Your Feedback!
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Body Text -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px;" class="mobile-padding">
                                <p style="margin:0 0 20px 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; line-height:24px; color:#666666;" class="dark-mode-subtext">
                                    Hi {{contact.name}},
                                </p>
                                <p style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; line-height:24px; color:#666666;" class="dark-mode-subtext">
                                    Thank you for choosing us! Your experience matters to us, and we'd appreciate it if you could take a moment to share your thoughts. Your feedback helps us improve and serve you better.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Stars -->
                        <tr>
                            <td align="center" style="padding:0 40px 35px 40px;">
                                <img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;">
                            </td>
                        </tr>
                        
                        <!-- CTA Button -->
                        <tr>
                            <td align="center" style="padding:0 40px 40px 40px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td class="cta-cell" style="border-radius:50px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow:0 4px 15px 0 rgba(102, 126, 234, 0.4);">
                                            <a href="${reviewUrl}" target="_blank" class="cta-btn" style="display:inline-block; padding:16px 36px; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:50px;">Share Your Feedback</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Secondary Message -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px; border-top:1px solid #eeeeee;" class="mobile-padding">
                                <p style="margin:25px 0 0 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:14px; line-height:21px; color:#999999;">
                                    It only takes 2 minutes, and your insights are invaluable to us!
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Thank You -->
                        <tr>
                            <td align="center" style="padding:25px 40px; background-color:#f8f9fa; border-bottom-left-radius:8px; border-bottom-right-radius:8px;">
                                <p style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:13px; line-height:18px; color:#999999;">
                                    Thank you for being a valued customer!
                                </p>
                            </td>
                        </tr>

                    </table>
                    
                </td>
            </tr>
        </table>
        
    </div>
</body>
</html>`;
}

function generateFollowupEmail(companyName: string, logoUrl: string, reviewUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>Did You Get a Chance to Share Your Thoughts?</title>
    
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse:collapse;border-spacing:0;margin:0;}
        div, td {padding:0;}
        div {margin:0 !important;}
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    
    <style type="text/css">
        /* Reset */
        body, table, td, a {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;}
        table, td {mso-table-lspace:0pt; mso-table-rspace:0pt;}
        img {-ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none;}
        body {height:100% !important; margin:0 !important; padding:0 !important; width:100% !important;}
        
        /* Button */
        .cta-btn {
            display:inline-block;
            padding:16px 36px;
            font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size:16px;
            font-weight:bold;
            color:#ffffff;
            text-decoration:none;
            border-radius:50px;
            background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow:0 4px 15px 0 rgba(102, 126, 234, 0.4);
        }
        
        .cta-cell {
            border-radius:50px;
            background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Mobile */
        @media screen and (max-width:600px) {
            .container {width:100% !important; max-width:100% !important;}
            .mobile-padding {padding:20px !important;}
            h1 {font-size:28px !important; line-height:36px !important;}
            .cta-btn {display:block !important; padding:18px !important;}
            .star {width:40px !important; height:40px !important; margin:0 3px !important;}
        }
        
        /* Dark Mode */
        @media (prefers-color-scheme:dark) {
            .dark-mode-text {color:#ffffff !important;}
            .dark-mode-subtext {color:#cccccc !important;}
        }
    </style>
</head>

<body style="margin:0; padding:0; background-color:#f4f4f4;">
    <div role="article" aria-roledescription="email" lang="en">
        
        <!-- Preheader -->
        <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
            We'd still love to hear from you! Your feedback helps us improve...
        </div>
        
        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="border-collapse:collapse;">
            <tr>
                <td align="center" style="padding:20px 0;">
                    
                    <!-- Main Content Card -->
                    <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        
                        <!-- Logo -->
                        <tr>
                            <td align="center" style="padding:40px 20px 30px 20px;">
                                <img src="${logoUrl}" alt="${companyName}" width="200" style="display:block; width:200px; max-width:100%; height:auto;">
                            </td>
                        </tr>
                        
                        <!-- Headline -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px;" class="mobile-padding">
                                <h1 style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:32px; font-weight:bold; color:#333333; line-height:40px;" class="dark-mode-text">
                                    Did You Get a Chance?
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Body Text -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px;" class="mobile-padding">
                                <p style="margin:0 0 20px 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; line-height:24px; color:#666666;" class="dark-mode-subtext">
                                    Hi {{contact.name}},
                                </p>
                                <p style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; line-height:24px; color:#666666;" class="dark-mode-subtext">
                                    We sent you a message a few days ago asking about your recent experience with us. We understand life gets busy, but we'd still love to hear your thoughts!
                                </p>
                                <p style="margin:20px 0 0 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; line-height:24px; color:#666666;" class="dark-mode-subtext">
                                    Your feedback is incredibly valuable and helps us continue to improve. It only takes 2 minutes to complete.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Stars -->
                        <tr>
                            <td align="center" style="padding:0 40px 35px 40px;">
                                <img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;">
                            </td>
                        </tr>
                        
                        <!-- CTA Button -->
                        <tr>
                            <td align="center" style="padding:0 40px 40px 40px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td class="cta-cell" style="border-radius:50px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow:0 4px 15px 0 rgba(102, 126, 234, 0.4);">
                                            <a href="${reviewUrl}" target="_blank" class="cta-btn" style="display:inline-block; padding:16px 36px; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:50px;">Take 2 Minutes to Help Us</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Secondary Message -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px; border-top:1px solid #eeeeee;" class="mobile-padding">
                                <p style="margin:25px 0 0 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:14px; line-height:21px; color:#999999;">
                                    Your opinion matters to us and helps shape the experience for all our customers.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Thank You -->
                        <tr>
                            <td align="center" style="padding:25px 40px; background-color:#f8f9fa; border-bottom-left-radius:8px; border-bottom-right-radius:8px;">
                                <p style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:13px; line-height:18px; color:#999999;">
                                    We appreciate your time and continued support!
                                </p>
                            </td>
                        </tr>

                    </table>
                    
                </td>
            </tr>
        </table>
        
    </div>
</body>
</html>`;
}

function generateFinalEmail(companyName: string, logoUrl: string, reviewUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>Last Chance - We'd Love Your Input!</title>
    
    <!--[if mso]>
    <style type="text/css">
        table {border-collapse:collapse;border-spacing:0;margin:0;}
        div, td {padding:0;}
        div {margin:0 !important;}
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    
    <style type="text/css">
        /* Reset */
        body, table, td, a {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;}
        table, td {mso-table-lspace:0pt; mso-table-rspace:0pt;}
        img {-ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none;}
        body {height:100% !important; margin:0 !important; padding:0 !important; width:100% !important;}
        
        /* Button */
        .cta-btn {
            display:inline-block;
            padding:16px 36px;
            font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size:16px;
            font-weight:bold;
            color:#ffffff;
            text-decoration:none;
            border-radius:50px;
            background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow:0 4px 15px 0 rgba(102, 126, 234, 0.4);
        }
        
        .cta-cell {
            border-radius:50px;
            background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Mobile */
        @media screen and (max-width:600px) {
            .container {width:100% !important; max-width:100% !important;}
            .mobile-padding {padding:20px !important;}
            h1 {font-size:28px !important; line-height:36px !important;}
            .cta-btn {display:block !important; padding:18px !important;}
            .star {width:40px !important; height:40px !important; margin:0 3px !important;}
        }
        
        /* Dark Mode */
        @media (prefers-color-scheme:dark) {
            .dark-mode-text {color:#ffffff !important;}
            .dark-mode-subtext {color:#cccccc !important;}
        }
    </style>
</head>

<body style="margin:0; padding:0; background-color:#f4f4f4;">
    <div role="article" aria-roledescription="email" lang="en">
        
        <!-- Preheader -->
        <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
            This is your final opportunity to share your valuable feedback with us...
        </div>
        
        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="border-collapse:collapse;">
            <tr>
                <td align="center" style="padding:20px 0;">
                    
                    <!-- Main Content Card -->
                    <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        
                        <!-- Logo -->
                        <tr>
                            <td align="center" style="padding:40px 20px 30px 20px;">
                                <img src="${logoUrl}" alt="${companyName}" width="200" style="display:block; width:200px; max-width:100%; height:auto;">
                            </td>
                        </tr>
                        
                        <!-- Headline -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px;" class="mobile-padding">
                                <h1 style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:32px; font-weight:bold; color:#333333; line-height:40px;" class="dark-mode-text">
                                    Last Chance to Share!
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Body Text -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px;" class="mobile-padding">
                                <p style="margin:0 0 20px 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; line-height:24px; color:#666666;" class="dark-mode-subtext">
                                    Hi {{contact.name}},
                                </p>
                                <p style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; line-height:24px; color:#666666;" class="dark-mode-subtext">
                                    This is our final request for your feedback about your recent experience with us. We truly value your opinion and would love to know how we did.
                                </p>
                                <p style="margin:20px 0 0 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; line-height:24px; color:#666666;" class="dark-mode-subtext">
                                    Whether your experience was great or there's room for improvement, your honest feedback helps us serve you and all our customers better. This is your last opportunity to make your voice heard!
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Stars -->
                        <tr>
                            <td align="center" style="padding:0 40px 35px 40px;">
                                <img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;"><!--
                                --><img src="https://5me.io/wp-content/uploads/2025/10/star.svg" alt="★" class="star" style="width:45px; height:45px; margin:0 5px; display:inline-block;">
                            </td>
                        </tr>
                        
                        <!-- CTA Button -->
                        <tr>
                            <td align="center" style="padding:0 40px 40px 40px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td class="cta-cell" style="border-radius:50px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow:0 4px 15px 0 rgba(102, 126, 234, 0.4);">
                                            <a href="${reviewUrl}" target="_blank" class="cta-btn" style="display:inline-block; padding:16px 36px; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:50px;">Share Your Experience Now</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Secondary Message -->
                        <tr>
                            <td align="center" style="padding:0 40px 30px 40px; border-top:1px solid #eeeeee;" class="mobile-padding">
                                <p style="margin:25px 0 0 0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:14px; line-height:21px; color:#999999;">
                                    Thank you for considering our request. We won't be sending additional follow-ups after this.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Thank You -->
                        <tr>
                            <td align="center" style="padding:25px 40px; background-color:#f8f9fa; border-bottom-left-radius:8px; border-bottom-right-radius:8px;">
                                <p style="margin:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size:13px; line-height:18px; color:#999999;">
                                    Thank you for being a valued customer. We appreciate you!
                                </p>
                            </td>
                        </tr>

                    </table>
                    
                </td>
            </tr>
        </table>
        
    </div>
</body>
</html>`;
}
