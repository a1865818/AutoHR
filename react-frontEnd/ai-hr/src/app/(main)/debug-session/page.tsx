'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { jobService } from '@/services/jobService';

export default function DebugSessionPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [jobServiceUser, setJobServiceUser] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');
  const [localStorage, setLocalStorage] = useState<any>(null);
  const [sessionStorage, setSessionStorage] = useState<any>(null);

  useEffect(() => {
    // Get jobService user data
    const authData = jobService.getCurrentUser();
    setJobServiceUser(authData);

    // Get cookies
    setCookies(document.cookie);

    // Get localStorage data
    const localData = {
      currentUser: localStorage.getItem('currentUser'),
      authToken: localStorage.getItem('authToken'),
      userCategory: localStorage.getItem('userCategory'),
    };
    setLocalStorage(localData);

    // Get sessionStorage data
    const sessionData = {
      currentUser: sessionStorage.getItem('currentUser'),
      authToken: sessionStorage.getItem('authToken'),
      userCategory: sessionStorage.getItem('userCategory'),
    };
    setSessionStorage(sessionData);
  }, []);

  const parseUserData = (data: string | null) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      return { error: 'Failed to parse JSON' };
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Session Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Context */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Auth Context</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        {/* JobService User */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">JobService.getCurrentUser()</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(jobServiceUser, null, 2)}
          </pre>
        </div>

        {/* Cookies */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          <div className="space-y-2">
            <p><strong>Raw Cookies:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {cookies}
            </pre>
            <p><strong>Parsed userData:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {(() => {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                  let cookie = cookies[i];
                  while (cookie.charAt(0) === ' ') {
                    cookie = cookie.substring(1, cookie.length);
                  }
                  if (cookie.indexOf('userData=') === 0) {
                    try {
                      const userData = JSON.parse(decodeURIComponent(cookie.substring('userData='.length, cookie.length)));
                      return JSON.stringify(userData, null, 2);
                    } catch (error) {
                      return 'Failed to parse userData from cookie';
                    }
                  }
                }
                return 'No userData cookie found';
              })()}
            </pre>
          </div>
        </div>

        {/* LocalStorage */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">LocalStorage</h2>
          <div className="space-y-2">
            <p><strong>Raw Data:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(localStorage, null, 2)}
            </pre>
            <p><strong>Parsed currentUser:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(parseUserData(localStorage?.currentUser), null, 2)}
            </pre>
          </div>
        </div>

        {/* SessionStorage */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">SessionStorage</h2>
          <div className="space-y-2">
            <p><strong>Raw Data:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(sessionStorage, null, 2)}
            </pre>
            <p><strong>Parsed currentUser:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(parseUserData(sessionStorage?.currentUser), null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Company ID Analysis</h3>
        <div className="space-y-1 text-sm">
          <p><strong>Auth Context companyId:</strong> {user?.companyId || 'undefined'}</p>
          <p><strong>JobService companyId:</strong> {jobServiceUser?.companyId || 'undefined'}</p>
          <p><strong>Cookie userData companyId:</strong> {
            (() => {
              const cookies = document.cookie.split(';');
              for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i];
                while (cookie.charAt(0) === ' ') {
                  cookie = cookie.substring(1, cookie.length);
                }
                if (cookie.indexOf('userData=') === 0) {
                  try {
                    const userData = JSON.parse(decodeURIComponent(cookie.substring('userData='.length, cookie.length)));
                    return userData.companyId || 'undefined';
                  } catch (error) {
                    return 'parse error';
                  }
                }
              }
              return 'not found';
            })()
          }</p>
          <p><strong>LocalStorage companyId:</strong> {parseUserData(localStorage?.currentUser)?.companyId || 'undefined'}</p>
          <p><strong>SessionStorage companyId:</strong> {parseUserData(sessionStorage?.currentUser)?.companyId || 'undefined'}</p>
        </div>
      </div>
    </div>
  );
} 