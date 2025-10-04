import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Calendar, 
  User, 
  ArrowRight, 
  Tag,
  Clock,
  TrendingUp,
  Shield,
  FileText,
  Lock,
  Smartphone,
  Hash,
  PenTool,
  Briefcase,
  Timer,
  Eye,
  Share2,
  Heart,
  Bookmark,
  MessageSquare,
  Send,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Posts', count: 12 },
    { id: 'legal', name: 'Legal Protection', count: 4 },
    { id: 'business', name: 'Business Tips', count: 3 },
    { id: 'technology', name: 'Technology', count: 3 },
    { id: 'case-studies', name: 'Case Studies', count: 2 }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "How Blockchain Evidence Won a £50,000 Dispute Case",
      excerpt: "Learn how electrician James Mitchell used TradeGuard's blockchain evidence to win a major payment dispute in court.",
      content: "In this detailed case study, we explore how James Mitchell, a London-based electrician, used TradeGuard's blockchain timestamping to prove the authenticity of his work documentation in a £50,000 payment dispute...",
      author: "Sarah Johnson",
      date: "2024-01-15",
      readTime: "5 min read",
      category: "case-studies",
      tags: ["blockchain", "legal", "dispute", "electrician"],
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop",
      featured: true,
      views: 1250,
      likes: 89,
      comments: 23
    },
    {
      id: 2,
      title: "The Complete Guide to Legal Evidence for Tradespeople",
      excerpt: "Everything you need to know about capturing legally admissible evidence for your trade business.",
      content: "As a tradesperson, you know that disputes can happen. Whether it's a payment dispute, insurance claim, or legal proceeding, having proper evidence can make all the difference...",
      author: "Mike Roberts",
      date: "2024-01-12",
      readTime: "8 min read",
      category: "legal",
      tags: ["legal", "evidence", "documentation", "protection"],
      image: "https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=600&h=400&fit=crop",
      featured: false,
      views: 980,
      likes: 67,
      comments: 15
    },
    {
      id: 3,
      title: "5 Ways to Increase Your Business Revenue with Better Documentation",
      excerpt: "Discover how professional documentation can help you win more jobs and increase your rates.",
      content: "Professional documentation isn't just about legal protection—it's also a powerful business tool. Here are five ways better documentation can increase your revenue...",
      author: "Emma Thompson",
      date: "2024-01-10",
      readTime: "6 min read",
      category: "business",
      tags: ["business", "revenue", "documentation", "growth"],
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
      featured: false,
      views: 756,
      likes: 45,
      comments: 12
    },
    {
      id: 4,
      title: "Understanding GDPR Compliance for Trade Businesses",
      excerpt: "A comprehensive guide to GDPR requirements for tradespeople handling customer data.",
      content: "The General Data Protection Regulation (GDPR) affects all businesses that handle personal data, including trade businesses. Here's what you need to know...",
      author: "David Wilson",
      date: "2024-01-08",
      readTime: "7 min read",
      category: "legal",
      tags: ["gdpr", "compliance", "data", "legal"],
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop",
      featured: false,
      views: 634,
      likes: 38,
      comments: 8
    },
    {
      id: 5,
      title: "Mobile Technology Trends for Trade Professionals in 2024",
      excerpt: "Explore the latest mobile technology trends that are transforming the trade industry.",
      content: "The trade industry is rapidly adopting mobile technology to improve efficiency, safety, and customer service. Here are the key trends to watch in 2024...",
      author: "Lisa Chen",
      date: "2024-01-05",
      readTime: "5 min read",
      category: "technology",
      tags: ["mobile", "technology", "trends", "innovation"],
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
      featured: false,
      views: 892,
      likes: 52,
      comments: 18
    },
    {
      id: 6,
      title: "Insurance Claims: How Proper Documentation Saves Time and Money",
      excerpt: "Learn how detailed documentation can speed up insurance claims and reduce disputes.",
      content: "When accidents happen on the job, proper documentation can make the difference between a quick insurance payout and months of back-and-forth...",
      author: "Tom Anderson",
      date: "2024-01-03",
      readTime: "4 min read",
      category: "business",
      tags: ["insurance", "claims", "documentation", "business"],
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
      featured: false,
      views: 523,
      likes: 31,
      comments: 7
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'views') {
      return b.views - a.views;
    } else if (sortBy === 'likes') {
      return b.likes - a.likes;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-2xl font-bold text-primary">TradeGuard</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              TradeGuard Blog
            </h1>
            <p className="text-xl text-gray-600">
              Expert insights, tips, and case studies for professional tradespeople.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                {/* Search */}
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <Search className="w-4 h-4 mr-2" />
                      Search Posts
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 hover:border-primary transition-colors duration-200"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      Categories
                    </h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105 ${
                            selectedCategory === category.id ? 'bg-primary/10 text-primary border border-primary/20' : ''
                          }`}
                        >
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary" className="hover:bg-primary hover:text-white transition-colors duration-200">
                            {category.count}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sort Options */}
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <SortAsc className="w-4 h-4 mr-2" />
                      Sort By
                    </h3>
                    <div className="space-y-2">
                      {[
                        { id: 'date', label: 'Latest First', icon: Calendar },
                        { id: 'views', label: 'Most Popular', icon: Eye },
                        { id: 'likes', label: 'Most Liked', icon: Heart }
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={`w-full text-left flex items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105 ${
                            sortBy === option.id ? 'bg-primary/10 text-primary border border-primary/20' : ''
                          }`}
                        >
                          <option.icon className="w-4 h-4 mr-3" />
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Popular Tags */}
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Popular Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['blockchain', 'legal', 'evidence', 'business', 'technology', 'compliance'].map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary hover:text-white transition-all duration-200 hover:scale-105"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Featured Post */}
              {sortedPosts.find(post => post.featured) && (
                <Card className="mb-8 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative overflow-hidden">
                      <img
                        src={sortedPosts.find(post => post.featured)?.image}
                        alt="Featured post"
                        className="w-full h-64 md:h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <Badge className="absolute top-4 left-4 bg-primary text-white animate-pulse">
                        Featured
                      </Badge>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardContent className="p-8">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{sortedPosts.find(post => post.featured)?.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{sortedPosts.find(post => post.featured)?.readTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{sortedPosts.find(post => post.featured)?.views} views</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors duration-200">
                        {sortedPosts.find(post => post.featured)?.title}
                      </h2>
                      <p className="text-gray-600 mb-6 group-hover:text-gray-700 transition-colors duration-200">
                        {sortedPosts.find(post => post.featured)?.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {sortedPosts.find(post => post.featured)?.author}
                          </span>
                        </div>
                        <Button asChild className="group-hover:bg-primary group-hover:text-white transition-all duration-200 hover:scale-105">
                          <Link to={`/blog/${sortedPosts.find(post => post.featured)?.id}`}>
                            Read More
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* Blog Posts Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                {sortedPosts.filter(post => !post.featured).map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <div className="relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <Badge className="absolute top-4 left-4 bg-white text-gray-900 hover:bg-primary hover:text-white transition-colors duration-200">
                        {categories.find(cat => cat.id === post.category)?.name}
                      </Badge>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-200">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{post.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comments}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button asChild variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-white transition-all duration-200 hover:scale-105">
                          <Link to={`/blog/${post.id}`}>
                            Read More
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 transition-colors duration-200">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 transition-colors duration-200">
                            <Bookmark className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              <div className="text-center mt-12">
                <Button size="lg" className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 hover:shadow-xl">
                  Load More Posts
                  <Plus className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Newsletter Signup */}
              <Card className="mt-12 bg-gradient-to-r from-primary to-purple-600 text-white overflow-hidden">
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
                    <p className="text-blue-100 mb-6 max-w-md mx-auto">
                      Get the latest insights, tips, and case studies delivered to your inbox.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <Input
                        placeholder="Enter your email"
                        className="bg-white text-gray-900 placeholder-gray-500 hover:border-blue-300 transition-colors duration-200"
                      />
                      <Button className="bg-white text-primary hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                        Subscribe
                        <Send className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                    <p className="text-sm text-blue-200 mt-4">
                      No spam. Unsubscribe at any time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
