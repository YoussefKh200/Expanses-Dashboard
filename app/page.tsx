// app/page.tsx - Landing Page
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BarChart3, Upload, Zap, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              F
            </div>
            <h1 className="text-xl font-bold text-slate-900">Financial Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-700 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900">
            Take Control of Your <span className="text-blue-600">Finances</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Upload your bank statements, analyze spending patterns, and make smarter financial decisions. 
            Local-first, private, and completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 h-12">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 h-12 border-slate-300">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Demo Preview */}
          <div className="bg-gradient-to-b from-slate-100/40 to-transparent rounded-xl p-1 border border-slate-200">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Dashboard Preview</p>
                  <p className="text-sm text-slate-400">Upload CSV • Analyze Data • Track Spending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-center mb-16 text-slate-900">Why Choose Us?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Upload,
                title: "Easy Upload",
                description: "Drag and drop your CSV files or upload directly from your bank",
              },
              {
                icon: BarChart3,
                title: "Smart Analytics",
                description: "Get insights into your spending patterns with beautiful charts",
              },
              {
                icon: Zap,
                title: "AI Categorization",
                description: "Automatic transaction categorization with machine learning",
              },
              {
                icon: Lock,
                title: "Local-First & Private",
                description: "Your data stays on your device. We never store or share it",
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow">
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h4 className="font-bold text-lg mb-2 text-slate-900">{feature.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-center mb-16 text-slate-900">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up",
                description: "Create your free account in seconds",
              },
              {
                step: "2",
                title: "Upload CSV",
                description: "Upload your bank statements from major banks",
              },
              {
                step: "3",
                title: "Analyze",
                description: "View detailed analytics and control your spending",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-start">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl flex-shrink-0 mr-4">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-7 right-0 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-transparent transform translate-x-14"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4 text-white">Ready to Take Control?</h3>
          <p className="text-blue-100 mb-8 text-lg">
            Start analyzing your finances today. It's free and only takes a minute to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-blue-600 font-semibold text-base px-8 h-11">
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-blue-200 text-white hover:bg-blue-600/20 text-base px-8 h-11">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h5 className="text-white font-bold mb-4">Product</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4">Company</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-4">Support</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
                <li><a href="#" className="hover:text-white transition">Feedback</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© 2025 Financial Dashboard. All rights reserved. Local-first data privacy guaranteed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
