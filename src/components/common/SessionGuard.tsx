"use client";

// import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSessionCheck } from '@/hooks/useSessionCheck';

export default function SessionGuard() {
  const pathname = usePathname();

  // Only enable session check if user is logged in (not on signin page)
  const shouldCheckSession = pathname !== '/signin' && pathname !== '/privacy_policy';

  useSessionCheck(shouldCheckSession);

  // This component doesn't render anything
  return null;
}

