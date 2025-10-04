import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  FileCheck, 
  Lock, 
  Smartphone, 
  Camera, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Star, 
  Users, 
  Award, 
  ArrowRight,
  Play,
  MessageCircle,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Zap,
  Target,
  TrendingUp,
  Globe,
  Download,
  ChevronDown,
  Hash,
  PenTool,
  Briefcase,
  Timer,
  FileText,
  BarChart3,
  Settings,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Eye,
  Share2,
  Heart,
  Bookmark,
  MessageSquare,
  Send,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const Index = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const headerHeight = 80; // Account for sticky header
      const elementPosition = ref.current.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const testimonials = [
    {
      name: "James Mitchell",
      role: "Electrician",
      company: "Mitchell Electrical",
      content: "TradeGuard saved me £15,000 in a dispute. The blockchain evidence was undeniable in court.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      verified: true
    },
    {
      name: "Sarah Thompson",
      role: "Plumber",
      company: "Thompson Plumbing",
      content: "Finally, a professional way to document my work. My insurance claims are processed 3x faster now.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      verified: true
    },
    {
      name: "Mike Roberts",
      role: "Builder",
      company: "Roberts Construction",
      content: "The GPS tracking and timestamps give me complete confidence in my documentation.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      verified: true
    }
  ];

  const features = [
    {
      icon: Smartphone,
      title: "Mobile Evidence Capture",
      description: "High-resolution photos with GPS coordinates, timestamps, and client signatures",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      animation: "bounce"
    },
    {
      icon: Hash,
      title: "File Hashing",
      description: "Cryptographic file integrity verification ensures evidence authenticity",
      color: "text-green-600",
      bgColor: "bg-green-50",
      animation: "pulse"
    },
    {
      icon: PenTool,
      title: "Digital Signature Capture",
      description: "Secure electronic signatures with biometric verification",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      animation: "wiggle"
    },
    {
      icon: Briefcase,
      title: "Complete Job Management",
      description: "End-to-end project tracking from start to completion",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      animation: "slide"
    },
    {
      icon: Timer,
      title: "Time & Location Stamped Photos",
      description: "Automatically timestamped and geotagged evidence capture",
      color: "text-red-600",
      bgColor: "bg-red-50",
      animation: "rotate"
    },
    {
      icon: Lock,
      title: "Blockchain Security",
      description: "Cryptographically secured with Bitcoin blockchain timestamps",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      animation: "glow"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Capture Evidence",
      description: "Take photos with GPS location, timestamps, and client signatures",
      icon: Camera,
      color: "bg-blue-500"
    },
    {
      step: "2", 
      title: "Blockchain Protection",
      description: "Evidence is cryptographically secured on the Bitcoin blockchain",
      icon: Lock,
      color: "bg-green-500"
    },
    {
      step: "3",
      title: "Generate Reports",
      description: "Create professional PDF reports for legal proceedings",
      icon: FileCheck,
      color: "bg-purple-500"
    }
  ];

  const faqs = [
    {
      question: "Is TradeGuard legally admissible in court?",
      answer: "Yes, our blockchain timestamping creates cryptographically secure evidence that is legally admissible in UK courts. The Bitcoin blockchain provides immutable proof of when evidence was captured."
    },
    {
      question: "How does the 7-day free trial work?",
      answer: "You get full access to all TradeGuard features for 7 days with no credit card required. You can capture evidence, generate reports, and test all functionality before deciding to subscribe."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Your data remains accessible for 30 days after cancellation. You can export all your evidence and reports during this period. After 30 days, data is securely deleted in compliance with GDPR."
    },
    {
      question: "Can I use TradeGuard offline?",
      answer: "Yes, you can capture evidence offline. Photos and data are stored locally and automatically synchronized when you have internet connection. Blockchain timestamping requires internet access."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption, secure cloud storage, and blockchain technology. Your data is protected by GDPR compliance and never shared with third parties."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Tradespeople Protected", icon: Users },
    { number: "£2.5M+", label: "Disputes Resolved", icon: TrendingUp },
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield },
    { number: "24/7", label: "Customer Support", icon: MessageCircle }
  ];

  const blogPosts = [
    {
      title: "How Blockchain Evidence Won a £50,000 Dispute Case",
      excerpt: "Learn how electrician James Mitchell used TradeGuard's blockchain evidence to win a major payment dispute in court.",
      author: "Sarah Johnson",
      date: "2024-01-15",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop"
    },
    {
      title: "The Complete Guide to Legal Evidence for Tradespeople",
      excerpt: "Everything you need to know about capturing legally admissible evidence for your trade business.",
      author: "Mike Roberts",
      date: "2024-01-12",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=600&h=400&fit=crop"
    },
    {
      title: "5 Ways to Increase Your Business Revenue with Better Documentation",
      excerpt: "Discover how professional documentation can help you win more jobs and increase your rates.",
      author: "Emma Thompson",
      date: "2024-01-10",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-2xl font-bold text-primary">TradeGuard</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection(featuresRef)} 
                className="text-gray-600 hover:text-primary transition-colors duration-200 hover:scale-105"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection(pricingRef)} 
                className="text-gray-600 hover:text-primary transition-colors duration-200 hover:scale-105"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection(testimonialsRef)} 
                className="text-gray-600 hover:text-primary transition-colors duration-200 hover:scale-105"
              >
                Testimonials
              </button>
              <Link to="/blog" className="text-gray-600 hover:text-primary transition-colors duration-200 hover:scale-105">
                Blog
              </Link>
              <button 
                onClick={() => scrollToSection(contactRef)} 
                className="text-gray-600 hover:text-primary transition-colors duration-200 hover:scale-105"
              >
                Contact
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => {
                    scrollToSection(featuresRef);
                    setIsMenuOpen(false);
                  }} 
                  className="text-gray-600 hover:text-primary transition-colors text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    scrollToSection(pricingRef);
                    setIsMenuOpen(false);
                  }} 
                  className="text-gray-600 hover:text-primary transition-colors text-left"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => {
                    scrollToSection(testimonialsRef);
                    setIsMenuOpen(false);
                  }} 
                  className="text-gray-600 hover:text-primary transition-colors text-left"
                >
                  Testimonials
                </button>
                <Link to="/blog" className="text-gray-600 hover:text-primary transition-colors">
                  Blog
                </Link>
                <button 
                  onClick={() => {
                    scrollToSection(contactRef);
                    setIsMenuOpen(false);
                  }} 
                  className="text-gray-600 hover:text-primary transition-colors text-left"
                >
                  Contact
                </button>
                <Link to="/signin" className="text-gray-600 hover:text-primary transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="space-y-4">
                  <Badge className="bg-primary/10 text-primary border-primary/20 animate-bounce">
                    🛡️ Trusted by 10,000+ Tradespeople
                  </Badge>
                  <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                    Protect Your Business with
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 animate-pulse">
                      {" "}Blockchain Evidence
                    </span>
          </h1>
                  <p className="text-xl text-gray-600 leading-relaxed">
            Capture legally admissible evidence, generate court-ready reports, and protect yourself from payment disputes. 
            Built exclusively for tradespeople who value professional documentation.
          </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl">
                    <Link to="/signup">Start 7-Day Free Trial</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 transition-all duration-200 hover:scale-105">
                    <Link to="#demo">
                      <Play className="w-5 h-5 mr-2" />
                      Watch Demo
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2 animate-pulse">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center space-x-2 animate-pulse">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border animate-float">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Camera className="w-5 h-5 text-primary animate-bounce" />
                        <span className="font-semibold">Evidence Capture</span>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white rounded p-3 border hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">GPS Location</span>
                            <span className="text-sm font-mono">51.5074°N, 0.1278°W</span>
                          </div>
                        </div>
                        <div className="bg-white rounded p-3 border hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Timestamp</span>
                            <span className="text-sm font-mono">2024-01-15 14:30:25</span>
                          </div>
                        </div>
                        <div className="bg-green-50 rounded p-3 border border-green-200 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">Blockchain Verified</span>
                            <CheckCircle className="w-4 h-4 text-green-500 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="w-8 h-8 text-primary mr-2 animate-pulse" />
                  <div className="text-3xl lg:text-4xl font-bold text-primary">{stat.number}</div>
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Protect Your Business
            </h2>
            <p className="text-xl text-gray-600">
              Professional-grade tools designed specifically for tradespeople who value documentation and legal protection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-0">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className={`w-6 h-6 ${feature.color} animate-${feature.animation}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How TradeGuard Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, secure, and legally sound evidence capture in three easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
                <div className="relative mb-8">
                  <div className={`w-16 h-16 ${step.color} text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    {step.step}
                  </div>
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                    <step.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-200">
                  {step.title}
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Thousands of Tradespeople
            </h2>
            <p className="text-xl text-gray-600">
              See how TradeGuard is protecting businesses across the UK.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-200" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic group-hover:text-gray-700 transition-colors duration-200">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                        {testimonial.name}
                        {testimonial.verified && (
                          <CheckCircle className="w-4 h-4 text-green-500 inline ml-1" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start with a free trial, then choose the plan that works for your business.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-8 border-2 border-primary hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-0">
                <div className="text-center mb-8">
                  <Badge className="bg-primary text-white mb-4 animate-pulse">Most Popular</Badge>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">TradeGuard Pro</h3>
                  <p className="text-gray-600 mb-6">Professional evidence capture and documentation protection</p>
                  <div className="text-5xl font-bold text-primary mb-2">£99</div>
                  <div className="text-gray-600">per month</div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-3">
                    {[
                      'Unlimited evidence capture',
                      'Professional PDF reports',
                      'Blockchain timestamping',
                      'GPS location tracking',
                      'Client signature collection',
                      'Mobile app access',
                      'Cloud storage',
                      'Priority support'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
                        <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[
                      'Court-admissible evidence',
                      'Insurance claim support',
                      'Client management',
                      'Job tracking',
                      'Report generation',
                      'Data export',
                      'GDPR compliance',
                      '24/7 customer support'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
                        <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 w-full transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <Link to="/signup">Start 7-Day Free Trial</Link>
            </Button>
                  <p className="text-sm text-gray-500 mt-4">No credit card required • Cancel anytime</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about TradeGuard.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border hover:shadow-lg transition-all duration-200">
                <CardContent className="p-0">
                  <button
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                        activeFaq === index ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  {activeFaq === index && (
                    <div className="px-6 pb-6 text-gray-600 animate-in slide-in-from-top-2 duration-200">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Latest from Our Blog
            </h2>
            <p className="text-xl text-gray-600">
              Expert insights, tips, and case studies for professional tradespeople.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <div className="relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-white">
                    Featured
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-200 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-200">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{post.author}</span>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                      <Link to={`/blog/${index + 1}`}>
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105">
              <Link to="/blog">View All Posts</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Protect Your Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of tradespeople who trust TradeGuard for their evidence capture and legal protection needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-6 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-6 transition-all duration-200 hover:scale-105">
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Have questions about TradeGuard? We're here to help you protect your business.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Email Support</h4>
                        <p className="text-primary font-medium">support@tradeguard.co.uk</p>
                        <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <Phone className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Phone Support</h4>
                        <p className="text-primary font-medium">+44 20 7946 0958</p>
                        <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM GMT</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Support Hours</h4>
                        <p className="text-primary font-medium">24/7 Emergency Support</p>
                        <p className="text-sm text-gray-500">For urgent technical issues</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-purple-100 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Need Immediate Help?</h4>
                  <p className="text-gray-600 mb-4">
                    For urgent technical issues or emergency support, don't hesitate to reach out.
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Us Now
                  </Button>
                </div>
              </div>

              {/* Quick Contact Form */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
                <p className="text-gray-600 mb-8">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>

                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                        Full Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-primary transition-colors duration-200"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-primary transition-colors duration-200"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-2 block">
                      Subject *
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-primary transition-colors duration-200"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-primary transition-colors duration-200"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              <div className="flex space-x-4">
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200 hover:scale-110" />
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200 hover:scale-110" />
                <Linkedin className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200 hover:scale-110" />
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors duration-200 hover:scale-110" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection(featuresRef)} className="hover:text-white transition-colors duration-200 hover:scale-105 text-left">Features</button></li>
                <li><button onClick={() => scrollToSection(pricingRef)} className="hover:text-white transition-colors duration-200 hover:scale-105 text-left">Pricing</button></li>
                <li><Link to="/blog" className="hover:text-white transition-colors duration-200 hover:scale-105">Blog</Link></li>
                <li><button onClick={() => scrollToSection(contactRef)} className="hover:text-white transition-colors duration-200 hover:scale-105 text-left">Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection(contactRef)} className="hover:text-white transition-colors duration-200 hover:scale-105 text-left">Contact</button></li>
                <li><Link to="/help" className="hover:text-white transition-colors duration-200 hover:scale-105">Help Center</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors duration-200 hover:scale-105">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors duration-200 hover:scale-105">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center space-x-2 hover:text-white transition-colors duration-200">
                  <Phone className="w-4 h-4" />
                  <span>+44 20 7946 0958</span>
                </li>
                <li className="flex items-center space-x-2 hover:text-white transition-colors duration-200">
                  <Mail className="w-4 h-4" />
                  <span>support@tradeguard.co.uk</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TradeGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default Index;
