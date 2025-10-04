import { Shield, FileText, AlertTriangle, CheckCircle, Scale, Gavel, Lock, Users, CreditCard, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms = () => {
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
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Please read these terms carefully. By using TradeGuard, you agree to be bound by these terms and conditions.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Legally Binding</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            
            {/* Important Notice */}
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8">
              <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3" />
                Important Legal Notice
              </h2>
              <p className="text-red-700">
                These Terms of Service constitute a legally binding agreement between you and TradeGuard. 
                By accessing or using our services, you acknowledge that you have read, understood, and 
                agree to be bound by these terms. If you do not agree to these terms, you must not use our services.
              </p>
            </div>

            {/* Definitions */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Scale className="w-8 h-8 mr-3 text-primary" />
                Definitions
              </h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <dl className="space-y-4">
                  <div>
                    <dt className="font-semibold text-gray-900">"TradeGuard," "we," "us," "our"</dt>
                    <dd className="text-gray-700 ml-4">Refers to TradeGuard Limited, a company registered in England and Wales.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">"User," "you," "your"</dt>
                    <dd className="text-gray-700 ml-4">Refers to any individual or entity that accesses or uses our services.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">"Services"</dt>
                    <dd className="text-gray-700 ml-4">Refers to our evidence capture, blockchain verification, and related software services.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">"Content"</dt>
                    <dd className="text-gray-700 ml-4">Refers to any data, information, photos, videos, or other materials uploaded or created using our services.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">"Account"</dt>
                    <dd className="text-gray-700 ml-4">Refers to your registered user account with TradeGuard.</dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* Acceptance of Terms */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Acceptance of Terms</h2>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Binding Agreement</h3>
                  <p className="text-gray-700">
                    By creating an account, accessing our services, or using our software, you agree to be bound by 
                    these Terms of Service and our Privacy Policy. These terms apply to all users, including 
                    visitors, registered users, and subscribers.
                  </p>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Capacity to Contract</h3>
                  <p className="text-gray-700">
                    You represent and warrant that you are at least 18 years old and have the legal capacity to 
                    enter into this agreement. If you are using our services on behalf of a company, you represent 
                    that you have the authority to bind that company to these terms.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Description */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-primary" />
                Service Description
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Core Services</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Evidence Capture:</strong> Mobile-based photo and video capture with GPS and timestamp verification</li>
                    <li><strong>Blockchain Verification:</strong> OpenTimestamps integration for immutable proof of existence</li>
                    <li><strong>Digital Signatures:</strong> Client signature capture and verification</li>
                    <li><strong>Legal Reports:</strong> Generation of court-ready compliance reports</li>
                    <li><strong>Data Management:</strong> Secure storage and organization of evidence files</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Availability</h3>
                  <p className="text-gray-700">
                    We strive to provide 99.9% uptime for our services, but we do not guarantee uninterrupted access. 
                    We reserve the right to modify, suspend, or discontinue any part of our services with reasonable notice.
                  </p>
                </div>
              </div>
            </section>

            {/* User Obligations */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="w-8 h-8 mr-3 text-primary" />
                User Obligations and Responsibilities
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Security</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Maintain the confidentiality of your account credentials</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Use strong passwords and enable two-factor authentication</li>
                    <li>Keep your contact information up to date</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Permitted Use</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Use services only for legitimate business purposes</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Respect intellectual property rights</li>
                    <li>Maintain professional standards in evidence capture</li>
                  </ul>
                </div>

                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">Prohibited Activities</h3>
                  <ul className="list-disc list-inside space-y-2 text-red-700">
                    <li>Uploading false, misleading, or fraudulent evidence</li>
                    <li>Attempting to reverse engineer or hack our systems</li>
                    <li>Using services for illegal activities</li>
                    <li>Violating any third-party rights</li>
                    <li>Distributing malware or harmful content</li>
                    <li>Circumventing security measures or access controls</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Payment Terms */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="w-8 h-8 mr-3 text-primary" />
                Payment Terms and Billing
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Subscription Fees</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>Prices may change with 30 days' notice to existing subscribers</li>
                    <li>Free trial periods are subject to automatic conversion to paid subscriptions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Processing</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Payments are processed securely through Stripe</li>
                    <li>You authorize us to charge your payment method for all fees</li>
                    <li>Failed payments may result in service suspension</li>
                    <li>You are responsible for all applicable taxes and fees</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation and Refunds</h3>
                  <p className="text-gray-700">
                    You may cancel your subscription at any time through your account settings. 
                    Cancellation takes effect at the end of your current billing period. No refunds 
                    are provided for partial months or unused services, except as required by applicable law.
                  </p>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Gavel className="w-8 h-8 mr-3 text-primary" />
                Intellectual Property Rights
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Rights</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>TradeGuard retains all rights to our software, technology, and proprietary methods</li>
                    <li>Our trademarks, logos, and branding are protected intellectual property</li>
                    <li>You may not copy, modify, or distribute our software without permission</li>
                    <li>We reserve all rights not expressly granted to you</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Content</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>You retain ownership of all content you upload to our services</li>
                    <li>You grant us a limited license to process and store your content</li>
                    <li>You represent that you have all necessary rights to your content</li>
                    <li>You are responsible for ensuring your content does not infringe third-party rights</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">License Grant</h3>
                  <p className="text-gray-700">
                    We grant you a limited, non-exclusive, non-transferable license to use our services 
                    in accordance with these terms. This license terminates automatically if you breach 
                    these terms or your account is terminated.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Lock className="w-8 h-8 mr-3 text-primary" />
                Data Protection and Privacy
              </h2>
              
              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Commitment</h3>
                  <p className="text-gray-700">
                    We are committed to protecting your privacy and personal data. Our data collection, 
                    use, and protection practices are detailed in our Privacy Policy, which is incorporated 
                    by reference into these terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Ensure you have proper consent for all personal data you upload</li>
                    <li>Comply with applicable data protection laws (GDPR, CCPA, etc.)</li>
                    <li>Implement appropriate security measures for your data</li>
                    <li>Notify us of any data breaches or security incidents</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Service Level Agreement */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Service Level Agreement</h2>
              
              <div className="bg-gray-50 p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Uptime and Availability</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Service Targets</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li><strong>Uptime:</strong> 99.9% availability target</li>
                      <li><strong>Response Time:</strong> &lt; 2 seconds for standard operations</li>
                      <li><strong>Data Backup:</strong> Daily automated backups</li>
                      <li><strong>Security:</strong> Regular security updates and patches</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Service Credits</h4>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Service credits for extended outages</li>
                      <li>Pro-rated refunds for significant downtime</li>
                      <li>Priority support for enterprise customers</li>
                      <li>Incident reporting and resolution tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Limitation of Liability</h2>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">Important Limitations</h3>
                <p className="text-red-700 mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRADEGUARD SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside space-y-2 text-red-700">
                  <li>Any indirect, incidental, special, or consequential damages</li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Damages resulting from third-party actions or system failures</li>
                  <li>Legal costs or attorney fees</li>
                  <li>Any damages exceeding the amount paid for services in the 12 months preceding the claim</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Exceptions</h3>
                <p className="text-gray-700">
                  These limitations do not apply to: (1) death or personal injury caused by our negligence, 
                  (2) fraud or fraudulent misrepresentation, (3) any liability that cannot be excluded by law, 
                  or (4) willful misconduct or gross negligence.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Indemnification</h2>
              
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Indemnification Obligations</h3>
                <p className="text-gray-700 mb-4">
                  You agree to indemnify, defend, and hold harmless TradeGuard and its officers, directors, 
                  employees, and agents from and against any and all claims, damages, losses, costs, and 
                  expenses (including reasonable attorney fees) arising from:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Your use of our services in violation of these terms</li>
                  <li>Your violation of any applicable laws or regulations</li>
                  <li>Your infringement of any third-party rights</li>
                  <li>Your content or data that violates these terms</li>
                  <li>Your negligence or willful misconduct</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Termination</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Termination by You</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>You may terminate your account at any time through account settings</li>
                    <li>Termination takes effect at the end of your current billing period</li>
                    <li>You are responsible for downloading your data before termination</li>
                    <li>Some data may be retained for legal compliance purposes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Termination by Us</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>We may terminate your account for breach of these terms</li>
                    <li>We may suspend services for non-payment or security reasons</li>
                    <li>We will provide reasonable notice except in cases of serious breach</li>
                    <li>Termination does not relieve you of payment obligations</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Effect of Termination</h3>
                  <p className="text-gray-700">
                    Upon termination, your right to use our services ceases immediately. We may delete 
                    your account and data after a reasonable period, subject to legal retention requirements. 
                    Provisions that by their nature should survive termination will remain in effect.
                  </p>
                </div>
              </div>
            </section>

            {/* Governing Law */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Governing Law and Disputes</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Governing Law</h3>
                  <p className="text-gray-700">
                    These terms are governed by the laws of England and Wales. Any disputes arising from 
                    these terms or your use of our services will be subject to the exclusive jurisdiction 
                    of the courts of England and Wales.
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dispute Resolution</h3>
                  <p className="text-gray-700">
                    We encourage resolution of disputes through good faith negotiation. If disputes cannot 
                    be resolved amicably, they will be subject to binding arbitration or court proceedings 
                    as appropriate under applicable law.
                  </p>
                </div>
              </div>
            </section>

            {/* Force Majeure */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Force Majeure</h2>
              
              <div className="bg-yellow-50 p-6 rounded-lg">
                <p className="text-gray-700">
                  We shall not be liable for any failure or delay in performance due to circumstances beyond 
                  our reasonable control, including but not limited to acts of God, natural disasters, war, 
                  terrorism, government actions, internet outages, or other force majeure events.
                </p>
              </div>
            </section>

            {/* Severability */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Severability</h2>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-700">
                  If any provision of these terms is found to be invalid or unenforceable, the remaining 
                  provisions will continue in full force and effect. We will replace invalid provisions 
                  with valid provisions that achieve the same economic and legal result.
                </p>
              </div>
            </section>

            {/* Entire Agreement */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Entire Agreement</h2>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <p className="text-gray-700">
                  These terms, together with our Privacy Policy and any additional agreements, constitute 
                  the entire agreement between you and TradeGuard. They supersede all prior agreements, 
                  representations, and understandings. Any modifications must be in writing and signed by 
                  both parties.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="bg-primary/10 p-8 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Legal and Business Inquiries</h3>
                <p className="text-gray-700 mb-6">
                  For questions about these terms, legal matters, or business inquiries, please contact us:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Legal Department</h4>
                    <div className="space-y-2 text-gray-700">
                      <p className="flex items-center"><Mail className="w-4 h-4 mr-2" />legal@tradeguard.co.uk</p>
                      <p className="flex items-center"><Phone className="w-4 h-4 mr-2" />+44 20 7946 0958</p>
                      <p><strong>Address:</strong> London, UK</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Business Hours</h4>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM GMT</p>
                      <p><strong>Emergency Support:</strong> 24/7 for critical issues</p>
                      <p><strong>Response Time:</strong> 24-48 hours for legal inquiries</p>
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
                These Terms of Service are provided for informational purposes only and do not constitute 
                legal advice. For specific legal questions, please consult with a qualified legal professional. 
                TradeGuard reserves the right to modify these terms at any time in accordance with applicable laws.
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

export default Terms;
