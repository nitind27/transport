"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function CategoryIdGuard() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip check for login and privacy policy pages
    if (pathname === '/signin' || pathname === '/privacy_policy') {
      return;
    }

    // Check if we're on client-side
    if (typeof window === 'undefined') {
      return;
    }

    // Function to check category_id in sessionStorage
    const checkCategoryId = () => {
      try {
        const categoryId = sessionStorage.getItem('category_id');
        
        // If category_id is missing or empty, redirect to login
        if (!categoryId || categoryId.trim() === '') {
          window.location.href = '/signin';
          return;
        }
      } catch (error) {
        // If sessionStorage access fails, redirect to login
        console.error('Error accessing sessionStorage:', error);
        window.location.href = '/signin';
      }
    };

    // Check immediately when component mounts or pathname changes
    checkCategoryId();

    // Set up periodic check to catch cases where sessionStorage is cleared
    const interval = setInterval(() => {
      checkCategoryId();
    }, 500); // Check every 500ms

    // Listen for route changes via Next.js
    const handleRouteChange = () => {
      if (pathname !== '/signin' && pathname !== '/privacy_policy') {
        checkCategoryId();
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

