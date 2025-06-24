
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {

        
        // Extract tokens from cookies
        const extractTokenFromCookie = (cookieName) => {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === cookieName) {
              return value;
            }
          }
          return null;
        };

        const accessToken = extractTokenFromCookie('clientAccessToken');
        const refreshToken = extractTokenFromCookie('clientRefreshToken');
        
        if (accessToken && refreshToken) {
          // Store tokens in localStorage for client-side authentication
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Dispatch custom event to notify AuthContext of localStorage changes
          window.dispatchEvent(new Event('localStorageChange'));
          
          // Clear the OAuth cookies after extraction
          document.cookie = 'clientAccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'clientRefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          // Invalidate auth queries to force refetch with new tokens
          queryClient.invalidateQueries({ queryKey: ['auth'] });
          
          // Show success message
          toast.success('Successfully signed in with Google!');
          
        
          // Fetch user profile to determine role-based navigation
          try {
            const response = await fetch('/api/auth/profile', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              const userRole = userData.data?.user?.role || userData.user?.role;
              
              // Navigate based on user role
              let redirectPath = '/dashboard'; // default
              if (userRole === 'student') {
                redirectPath = '/student/dashboard';
              } else if (userRole === 'instructor') {
                redirectPath = '/instructor';
              } else if (userRole === 'admin') {
                redirectPath = '/admin';
              }
              
              // Small delay to ensure AuthContext updates before navigation
              setTimeout(() => {
                navigate(redirectPath, { replace: true });
              }, 100);
            } else {
              // Fallback to default dashboard if profile fetch fails
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 100);
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Fallback to default dashboard
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 100);
          }
        } else {
          console.error('No OAuth tokens found in cookies');
          toast.error('OAuth authentication failed. Please try again.');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('OAuth success handling error:', error);
        toast.error('Authentication error. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    // Small delay to ensure cookies are set
    const timer = setTimeout(handleOAuthSuccess, 100);
    
    return () => clearTimeout(timer);
  }, [navigate, queryClient]);

  if (!isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Completing Sign In</h2>
            <p className="text-slate-400">Please wait while we finish setting up your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Sign In Successful!</h2>
          <p className="text-slate-400">You have been successfully authenticated with Google.</p>
        </div>
        <div className="space-y-3">
          <button
             onClick={() => navigate('/dashboard')}
             className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
           >
             Go to Dashboard
           </button>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuthSuccess;