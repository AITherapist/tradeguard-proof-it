import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  const lastUpdated = "January 15, 2024";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <Shield className="h-12 w-12 text-primary animate-pulse" />
              <span className="text-4xl font-bold text-primary">TradeGuard</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your privacy and data security are our top priorities. Learn how we collect, 
              use, and protect your information.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            
            {/* Introduction */}
            <div className="bg-blue-50 border-l-4 border-primary p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-3 text-primary" />
                Our Commitment to Your Privacy
              </h2>
              <p className="text-gray-700">
                TradeGuard ("we," "our," or "us") is committed to protecting your privacy and ensuring 
                the security of your personal information. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our evidence capture and 
                blockchain verification services.
              </p>
            </div>

            {/* Information We Collect */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Database className="w-8 h-8 mr-3 text-primary" />
                Information We Collect
              </h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Account Information:</strong> Name, email address, phone number, company details</li>
                    <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely through Stripe)</li>
                    <li><strong>Profile Information:</strong> Professional credentials, trade specializations, business information</li>
                    <li><strong>Communication Data:</strong> Messages, support requests, and correspondence</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Evidence Data</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Photos and Videos:</strong> Images captured for evidence purposes</li>
                    <li><strong>Location Data:</strong> GPS coordinates and location information</li>
                    <li><strong>Timestamps:</strong> Date and time information for evidence verification</li>
                    <li><strong>Digital Signatures:</strong> Client signatures and verification data</li>
                    <li><strong>Job Information:</strong> Project details, client information, work descriptions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Device Information:</strong> Device type, operating system, browser information</li>
                    <li><strong>Usage Data:</strong> App usage patterns, feature utilization, performance metrics</li>
                    <li><strong>Log Data:</strong> IP addresses, access times, error logs</li>
                    <li><strong>Cookies and Tracking:</strong> Analytics data, user preferences, session information</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Eye className="w-8 h-8 mr-3 text-primary" />
                How We Use Your Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Provision</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    <li>Provide evidence capture and verification services</li>
                    <li>Generate blockchain timestamps and legal reports</li>
                    <li>Manage your account and subscription</li>
                    <li>Process payments and billing</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Compliance</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    <li>Maintain legally admissible evidence records</li>
                    <li>Ensure blockchain verification integrity</li>
                    <li>Comply with data protection regulations</li>
                    <li>Respond to legal requests and court orders</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Improvement</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    <li>Analyze usage patterns and performance</li>
                    <li>Develop new features and improvements</li>
                    <li>Conduct research and analytics</li>
                    <li>Optimize user experience</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                    <li>Send service notifications and updates</li>
                    <li>Provide customer support</li>
                    <li>Share important security information</li>
                    <li>Send marketing communications (with consent)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-primary" />
                Data Security and Protection
              </h2>
              
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Security Measures</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Technical Safeguards</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>End-to-end encryption for all data transmission</li>
                      <li>AES-256 encryption for data at rest</li>
                      <li>Secure cloud infrastructure (Supabase)</li>
                      <li>Regular security audits and penetration testing</li>
                      <li>Multi-factor authentication for admin access</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Operational Safeguards</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Limited access on a need-to-know basis</li>
                      <li>Regular staff training on data protection</li>
                      <li>Secure data centers with physical security</li>
                      <li>Incident response and breach notification procedures</li>
                      <li>Regular backup and disaster recovery testing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Information Sharing and Disclosure</h2>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  We Do NOT Sell Your Data
                </h3>
                <p className="text-red-700">
                  We never sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Limited Sharing Scenarios</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Service Providers:</strong> Trusted third-party services (Stripe for payments, Supabase for hosting)</li>
                    <li><strong>Legal Requirements:</strong> When required by law, court order, or legal process</li>
                    <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale (with notice)</li>
                    <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
                    <li><strong>Emergency:</strong> To protect rights, property, or safety</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <UserCheck className="w-8 h-8 mr-3 text-primary" />
                Your Rights and Choices
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Access and Portability</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                      <li>Access your personal data</li>
                      <li>Download your data in portable format</li>
                      <li>Request data correction or updates</li>
                      <li>View your data processing activities</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Control and Consent</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                      <li>Withdraw consent for data processing</li>
                      <li>Opt-out of marketing communications</li>
                      <li>Control cookie preferences</li>
                      <li>Manage notification settings</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Deletion and Restriction</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                      <li>Request data deletion ("right to be forgotten")</li>
                      <li>Restrict data processing</li>
                      <li>Object to automated decision-making</li>
                      <li>Request data processing suspension</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal and Compliance</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                      <li>Lodge complaints with supervisory authorities</li>
                      <li>Seek legal remedies for data breaches</li>
                      <li>Request data processing information</li>
                      <li>Exercise other legal rights</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Retention</h2>
              
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Retention Periods</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Account Data</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li><strong>Active Accounts:</strong> Retained while account is active</li>
                      <li><strong>Inactive Accounts:</strong> 3 years after last activity</li>
                      <li><strong>Deleted Accounts:</strong> 30 days grace period for recovery</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Evidence Data</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li><strong>Legal Evidence:</strong> 7 years minimum retention</li>
                      <li><strong>Blockchain Records:</strong> Permanent (immutable)</li>
                      <li><strong>Backup Data:</strong> 1 year after deletion request</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* International Transfers */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">International Data Transfers</h2>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Your data may be transferred to and processed in countries outside your country of residence. 
                  We ensure appropriate safeguards are in place for international transfers, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Standard Contractual Clauses (SCCs) for EU data transfers</li>
                  <li>Adequacy decisions by relevant authorities</li>
                  <li>Certification under recognized privacy frameworks</li>
                  <li>Explicit consent for specific transfers</li>
                </ul>
              </div>
            </section>

            {/* Children's Privacy */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Children's Privacy</h2>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                <p className="text-gray-700">
                  Our services are not intended for children under 16 years of age. We do not knowingly 
                  collect personal information from children under 16. If we become aware that we have 
                  collected personal information from a child under 16, we will take steps to delete 
                  such information promptly.
                </p>
              </div>
            </section>

            {/* Changes to Policy */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Changes to This Privacy Policy</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any material 
                  changes by:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Posting the updated policy on our website</li>
                  <li>Sending email notifications to registered users</li>
                  <li>Displaying prominent notices in our application</li>
                  <li>Providing advance notice for significant changes</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Your continued use of our services after any changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h2>
              
              <div className="bg-primary/10 p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy Questions and Concerns</h3>
                <p className="text-gray-700 mb-6">
                  If you have any questions about this Privacy Policy, your data rights, or wish to 
                  exercise any of your rights, please contact us:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Data Protection Officer</h4>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Email:</strong> privacy@tradeguard.co.uk</p>
                      <p><strong>Phone:</strong> +44 20 7946 0958</p>
                      <p><strong>Address:</strong> London, UK</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Response Times</h4>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>General Inquiries:</strong> 24-48 hours</p>
                      <p><strong>Data Requests:</strong> 30 days maximum</p>
                      <p><strong>Urgent Issues:</strong> 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Legal Disclaimer */}
            <div className="bg-red-50 border-l-4 border-red-500 p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Legal Disclaimer
              </h3>
              <p className="text-red-700 text-sm">
                This Privacy Policy is provided for informational purposes only and does not constitute 
                legal advice. For specific legal questions regarding data protection, please consult 
                with a qualified legal professional. TradeGuard reserves the right to modify this 
                policy at any time in accordance with applicable laws and regulations.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-primary animate-pulse" />
                <span className="text-2xl font-bold">TradeGuard</span>
              </div>
              <p className="text-gray-400 mb-4">
                Professional evidence capture and legal protection for tradespeople.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors duration-200 hover:scale-105">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors duration-200 hover:scale-105">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors duration-200 hover:scale-105">Cookie Policy</Link></li>
                <li><Link to="/gdpr" className="hover:text-white transition-colors duration-200 hover:scale-105">GDPR Compliance</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white transition-colors duration-200 hover:scale-105">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors duration-200 hover:scale-105">Contact Us</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors duration-200 hover:scale-105">Security</Link></li>
                <li><Link to="/status" className="hover:text-white transition-colors duration-200 hover:scale-105">System Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors duration-200 hover:scale-105">About</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors duration-200 hover:scale-105">Careers</Link></li>
                <li><Link to="/press" className="hover:text-white transition-colors duration-200 hover:scale-105">Press</Link></li>
                <li><Link to="/partners" className="hover:text-white transition-colors duration-200 hover:scale-105">Partners</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TradeGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
