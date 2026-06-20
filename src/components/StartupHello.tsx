import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function StartupHello({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after Apple-like timing
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          >
            <div className="w-full max-w-[800px] px-4 relative flex items-center justify-center">
              {/* Outer glow container */}
              <div className="relative w-full aspect-[4/3]">
                <iframe
                  src="https://lottie.host/embed/9b3b08a9-ec44-42b2-8e81-485e303431ee/CkO2B7b3pk.lottie"
                  className="w-full h-full border-none pointer-events-none"
                  allow="autoplay"
                ></iframe>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div 
        style={{ 
          opacity: showSplash ? 0 : 1, 
          pointerEvents: showSplash ? 'none' : 'auto',
          transition: 'opacity 1s ease-in-out',
          height: '100%' 
        }}
      >
        {children}
      </div>
    </>
  );
}
