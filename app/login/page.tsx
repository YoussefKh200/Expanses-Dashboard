// app/login/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    router.push("/upload");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-white to-slate-50 text-slate-900">
      {/* Back Link */}
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back Home
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              F
            </div>
            <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          </div>
          <p className="text-slate-500 text-lg">Sign in to your account</p>
        </div>

        <Card className="w-full max-w-[420px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border-slate-200">
          <form onSubmit={handleSignIn}>
            <CardContent className="p-8 pt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    className="pl-9 pr-9 h-11"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base">
                Sign In
              </Button>

              <div className="text-center text-sm mt-4">
                <span className="text-slate-600">Don't have an account? </span>
                <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                  Sign Up
                </Link>
              </div>

              
            </CardContent>
          </form>
        </Card>
      </div>

      <footer className="py-8 text-center text-xs text-slate-500">
        <p>Manager-facing HR operations dashboard</p>
        <p className="mt-1">© 2025 Helm HR Ops. All rights reserved.</p>
      </footer>
    </div>
  );
}
