"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getOrCreateDeviceId } from "@/utils/deviceId";

/**
 * Hook to check if user session is still valid
 * Polls the server periodically to check if user was logged out from another device
 */
export const useSessionCheck = (enabled: boolean = true) => {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const checkSession = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) return;
      
      try {
        isCheckingRef.current = true;
        const userId = sessionStorage.getItem('userid');
        const deviceId = getOrCreateDeviceId();
        
        if (!userId || !deviceId) {
          // No user ID or device ID, stop checking
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Check login status from server with device_id
        const response = await fetch(`/api/auth/check-session?user_id=${userId}&device_id=${encodeURIComponent(deviceId)}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          // Session invalid or user logged out
          // const data = await response.json();
          
          // If user was logged out from another device
          if (response.status === 401 || response.status === 403) {
            // Clear all storage
            sessionStorage.clear();
            localStorage.clear();
            
            toast.warning('You have been logged out from another device.');
            
            // Redirect to login
            router.push('/signin');
            
            // Stop checking
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        } else {
          const data = await response.json();
          
          // If session is not active or loginstatus is 0, user was logged out
          if (!data.sessionActive || data.loginstatus === 0) {
            // Clear all storage
            sessionStorage.clear();
            localStorage.clear();
            
            toast.warning('You have been logged out from another device.');
            
            // Redirect to login
            router.push('/signin');
            
            // Stop checking
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        // Don't logout on network errors, just log
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Check immediately on mount
    checkSession();

    // Set up polling every 5 seconds
    intervalRef.current = setInterval(checkSession, 5000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, router]);
};

