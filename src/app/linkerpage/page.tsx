"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/ui/footer";
import { 
  Brain, 
  Bot, 
  Menu, 
  X, 
  User, 
  LogIn, 
  LogOut, 
  Crown,
  Mail,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function TutorjiLandingPage() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const NavbarComponent = () => (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Tutorji
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-muted rounded-lg">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{session.user.name || session.user.email}</span>
              </div>
              <Link href="/pro">
                <Button variant="outline" size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-white hover:from-yellow-600 hover:to-orange-600">
                  <Crown className="w-4 h-4 mr-2" />
                  Pro
                </Button>
              </Link>
              <Button 
                onClick={() => signOut()} 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => signIn()} 
              variant="default"
              size="sm"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t bg-background"
        >
          <div className="container px-4 py-4 space-y-3">
            {status === "authenticated" && session?.user ? (
              <>
                <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{session.user.name || session.user.email}</span>
                </div>
                <Link href="/pro" className="block">
                  <Button variant="outline" size="sm" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-white hover:from-yellow-600 hover:to-orange-600">
                    <Crown className="w-4 h-4 mr-2" />
                    Pro - Buy More Credits
                  </Button>
                </Link>
                <Button 
                  onClick={() => signOut()} 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => signIn()} 
                variant="default"
                size="sm"
                className="w-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavbarComponent />
      
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 lg:py-24">
          <div className="container max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={stagger}
              initial="initial"
              animate="animate"
              className="text-center space-y-8"
            >
              <motion.div variants={fadeInUp} className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    Tutorji
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Your AI-powered learning companion that transforms the way students understand complex concepts through personalized explanations and step-by-step solutions.
                </p>
              </motion.div>

              {/* Development Status */}
              <motion.div variants={fadeInUp} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800/40 rounded-xl p-6 max-w-2xl mx-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-purple-700 dark:text-purple-300">
                    <span className="text-2xl">🚧</span>
                    <h3 className="text-lg font-semibold">Development Status</h3>
                  </div>
                  <div className="space-y-2 text-sm text-purple-600 dark:text-purple-400">
                    <div className="flex items-center justify-center space-x-2">
                      <span>🚧</span>
                      <span>This site is currently under development and testing.</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <span>✨</span>
                      <span>Early access is live.</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <span>🌐</span>
                      <span>Public launch coming soon.</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 mt-4">
                      <span>📬</span>
                      <span>For access, contact us at</span>
                      <a 
                        href="mailto:support@tutorji.in" 
                        className="font-medium text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 underline"
                      >
                        support@tutorji.in
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Us
                  </Button>
                </Link>
                <Link href="/suggest">
                  <Button variant="outline" size="lg" className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Suggestions
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-12"
            >
              <motion.div variants={fadeInUp} className="text-center space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Powerful Learning Tools
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Discover our AI-powered features designed to enhance your learning experience and boost academic success.
                </p>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Ask Page Feature */}
                <motion.div variants={fadeInUp} className="group">
                  <div className="h-full bg-card border rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-800">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold flex items-center space-x-2">
                            <span>🧠</span>
                            <span>Ask Page</span>
                          </h3>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        A smart doubt solver where students can ask questions and get instant, AI-powered explanations. 
                        Upload images, type questions, or describe problems to receive detailed, personalized answers 
                        tailored to your learning level.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Instant AI-powered explanations</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Image and text question support</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Personalized learning experience</span>
                        </div>
                      </div>
                      
                      <Link href="/ask" className="block">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group-hover:scale-105 transition-transform">
                          Try Ask Page
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>

                {/* StepsBot Feature */}
                <motion.div variants={fadeInUp} className="group">
                  <div className="h-full bg-card border rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold flex items-center space-x-2">
                            <span>🤖</span>
                            <span>StepsBot</span>
                          </h3>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        An intelligent tool that breaks down solutions into clear, step-by-step answers for deeper understanding. 
                        Perfect for complex problems that require systematic approach and detailed explanations.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Step-by-step problem breakdown</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Clear reasoning and logic</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Enhanced conceptual understanding</span>
                        </div>
                      </div>
                      
                      <Link href="/stepsbot" className="block">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white group-hover:scale-105 transition-transform">
                          Try StepsBot
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
