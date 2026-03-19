import Head from "next/head";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  // Initialize state directly from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false; // Guard for SSR
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme ? savedTheme === 'dark' : systemPrefersDark;
  });

  // This single effect handles all side effects related to the theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]); // This dependency array ensures the effect runs when `isDark` changes

  // The toggle function's only responsibility is to update the state
  const toggleTheme = () => {
    setIsDark(prevIsDark => !prevIsDark);
  };

  return (
    <>
      <Head>
        <title>Creating your app</title>
        <meta name="description" content="AI-powered application builder powered by CodeChi." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 overflow-hidden">
        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-2xl hover:scale-110 hover:rotate-12 transition-all duration-200 active:scale-90 z-50"
        >
          {isDark ? '☀️' : '🌙'}
        </Button>

        <div className="absolute inset-0 bg-gradient-rainbow opacity-10 dark:opacity-20" />
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6 relative z-10"
        >
          <div className="flex justify-center">
            <motion.div 
              className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary"
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-balance leading-tight">
            Creating your <span className="text-gradient">app</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto text-pretty">
            Your application would be ready soon.
          </p>

          <div className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                className="btn-gradient px-8 py-4 text-lg font-semibold"
              >
                Please wait
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <footer className="absolute bottom-8 text-center text-muted-foreground/80">
          <p>Powered by <a href="https://codechi.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">CodeChi</a></p>
        </footer>
      </main>
    </>
  );
}