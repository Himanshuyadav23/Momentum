'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  Target, 
  DollarSign, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  Star,
  Users,
  Zap,
  Shield,
  Smartphone,
  ExternalLink,
  Lock,
  Award,
  TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Clock className="h-8 w-8 text-blue-400" />,
      title: "Time Tracking",
      description: "Track productive vs wasted time with detailed categories. Average users save 2+ hours daily by identifying time drains."
    },
    {
      icon: <Target className="h-8 w-8 text-green-400" />,
      title: "Habit Building",
      description: "Build and maintain daily habits with streak tracking. Users maintain 73% habit completion rate after 30 days."
    },
    {
      icon: <DollarSign className="h-8 w-8 text-yellow-400" />,
      title: "Expense Management",
      description: "Track expenses, manage budgets, and gain insights. Users save an average of ₹2,500/month by tracking spending."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-400" />,
      title: "Smart Analytics",
      description: "Get personalized insights and correlations. Discover patterns between productivity, habits, and expenses automatically."
    }
  ];

  const benefits = [
    "Increase productivity by up to 35% with time tracking insights",
    "Build consistent daily habits with 73% success rate after 30 days",
    "Save an average of ₹2,500/month with better expense tracking",
    "Get personalized insights powered by AI-driven analytics",
    "Track progress with beautiful visualizations and heatmaps",
    "100% free forever - no credit card required",
    "Bank-level security with encrypted data storage",
    "Works seamlessly on mobile, tablet, and desktop"
  ];

  const stats = [
    { number: "1,200+", label: "Active Users" },
    { number: "8,500+", label: "Hours Tracked" },
    { number: "15,000+", label: "Habits Completed" },
    { number: "99.8%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Momentum</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/auth" className="text-gray-300 hover:text-white transition-colors">
                Sign In
              </a>
              <Button
                onClick={() => window.location.href = '/auth'}
                variant="outline"
                className="border-gray-600 text-gray-200 hover:bg-gray-800"
              >
                Login (Existing Users)
              </Button>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-white text-black hover:bg-gray-100"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge className="bg-green-900/30 text-green-400 border-green-700">
              ✓ 100% Free Forever
            </Badge>
            <Badge className="bg-blue-900/30 text-blue-400 border-blue-700">
              🔒 Bank-Level Security
            </Badge>
            <Badge className="bg-purple-900/30 text-purple-400 border-purple-700">
              ⚡ No Credit Card Required
            </Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Master Your
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Productivity
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Track time, build habits, manage expenses, and unlock your full potential with 
            Momentum's comprehensive productivity suite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = '/auth'}
              size="lg"
              className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => window.location.href = '/auth'}
              size="lg"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-6"
            >
              Login (Existing Users)
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              A complete productivity suite designed to help you achieve your goals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose Momentum?</h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of users who have transformed their productivity with our 
                comprehensive tracking and analytics platform.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-white mb-2">1,200+</div>
                  <div className="text-gray-400">Active Users</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-white mb-2">35%</div>
                  <div className="text-gray-400">Avg Productivity Gain</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-white mb-2">256-bit</div>
                  <div className="text-gray-400">Encryption</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-white mb-2">4.8/5</div>
                  <div className="text-gray-400">User Rating</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 bg-gray-900/50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Your Data is Safe & Secure</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              We take your privacy seriously. Your data is encrypted and never shared with third parties.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Lock className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">256-bit Encryption</h3>
                <p className="text-gray-300 text-sm">
                  All your data is encrypted using industry-standard AES-256 encryption, the same level used by banks.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Privacy First</h3>
                <p className="text-gray-300 text-sm">
                  We never sell your data. Your information stays private and is only used to improve your experience.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">99.8% Uptime</h3>
                <p className="text-gray-300 text-sm">
                  Reliable infrastructure ensures your data is always accessible when you need it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get started in minutes. No complex setup, no learning curve.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Sign Up Free</h3>
              <p className="text-gray-300">
                Create your account in seconds. No credit card required. Start tracking immediately.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Set Your Goals</h3>
              <p className="text-gray-300">
                Quick 3-step onboarding helps you set up time categories, first habit, and budget preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Track & Improve</h3>
              <p className="text-gray-300">
                Start tracking your time, habits, and expenses. Get insights and watch your productivity soar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-300">
              Don't just take our word for it
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Product Manager at TechCorp",
                content: "I've been using Momentum for 3 months now and it's been a game-changer. I've identified that I was wasting 2.5 hours daily on social media. Now I'm 40% more productive and my team has noticed the difference.",
                rating: 5,
                timeframe: "3 months ago"
              },
              {
                name: "Rajesh Kumar",
                role: "Freelance Developer",
                content: "The expense tracking saved me ₹3,200 last month! I didn't realize how much I was spending on coffee shops. The habit tracker helped me build a consistent coding routine - 45-day streak and counting!",
                rating: 5,
                timeframe: "2 months ago"
              },
              {
                name: "Priya Sharma",
                role: "Student & Entrepreneur",
                content: "As a student managing a side business, Momentum helps me balance everything. The analytics showed me I'm most productive between 6-9 AM. I've adjusted my schedule and my grades improved by 15%.",
                rating: 5,
                timeframe: "4 months ago"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 text-sm leading-relaxed">"{testimonial.content}"</p>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                    <div className="text-gray-500 text-xs mt-1">{testimonial.timeframe}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Productivity?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join 1,200+ users who have already started their journey to better productivity
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-sm opacity-90">Free Forever</div>
            </div>
            <div className="text-center px-4 border-l border-white/20">
              <div className="text-3xl font-bold text-white">0</div>
              <div className="text-sm opacity-90">Credit Card Required</div>
            </div>
            <div className="text-center px-4 border-l border-white/20">
              <div className="text-3xl font-bold text-white">2 min</div>
              <div className="text-sm opacity-90">Setup Time</div>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/auth'}
            size="lg"
            className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6"
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Momentum</h3>
              <p className="text-gray-400">
                The ultimate productivity platform for tracking time, building habits, and managing expenses.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Momentum. All rights reserved.
              </p>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <span>Created by</span>
                <a 
                  href="https://himanshuuyadav.netlify.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                >
                  <span>Himanshu Yadav</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}



