import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UseAdminAuthResult {
  isLoading: boolean;
  isAdmin: boolean;
  session: any;
}

export const useAdminAuth = (minLoadingTime: number = 5000): UseAdminAuthResult => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for session to load
      if (status === 'loading') return;

      // Calculate remaining time to meet minimum loading duration
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);

      // If not authenticated or not admin, wait for minimum time then redirect
      if (!session || session.user?.role !== 'admin') {
        if (remainingTime > 0) {
          setTimeout(() => {
            router.push('/unauthorized');
          }, remainingTime);
        } else {
          router.push('/unauthorized');
        }
        return;
      }

      // If admin, wait for minimum time then show content
      if (remainingTime > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [session, status, router, minLoadingTime, startTime]);

  return {
    isLoading,
    isAdmin: !!session && session.user?.role === 'admin',
    session
  };
}; 