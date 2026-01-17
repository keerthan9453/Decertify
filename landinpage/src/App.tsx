import React, { useEffect, useState } from 'react';
import { LandingPage } from './Components/Landingpage';
import { AuthPage } from './Components/auth';
import { RoleSelection } from './Components/Roleselection';
import type { UserRole } from './Components/Roleselection';
import { Dashboard } from './Components/Dashboard';
import './App.css';


const getToken = () => localStorage.getItem('token');

const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

function App() {
  const [view, setView] = useState<'landing' | 'auth' | 'roleSelection' | 'dashboard'>('landing');
  const [user, setUser] = useState<{ email: string; username: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('userRole') as UserRole | null;

    if (savedToken && savedUser) {
      if (isAuthenticated()) {
        console.log('Valid token found, auto-logging in');
        setUser(JSON.parse(savedUser));

        // If user has a saved role, go directly to dashboard
        // Otherwise, go to role selection
        if (savedRole) {
          setUserRole(savedRole);
          setView('dashboard');
        } else {
          setView('roleSelection');
        }
      } else {
        console.log('Token expired, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
      }
    }
  }, []);

  const handleAuth = (authData: any) => {
    console.log('Authentication successful:', authData);
    setUser({ email: authData.email, username: authData.username });
    // After authentication, go to role selection instead of dashboard
    setView('roleSelection');
  };

  const handleRoleSelect = (role: UserRole) => {
    console.log('Role selected:', role);
    setUserRole(role);
    localStorage.setItem('userRole', role);
    setView('dashboard');
  };

  const handleLogout = () => {
    console.log('Logging out, clearing token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    setUser(null);
    setUserRole(null);
    setView('landing');
  };

  const handleChangeRole = () => {
    // Allow user to change their role
    localStorage.removeItem('userRole');
    setUserRole(null);
    setView('roleSelection');
  };

  return (
    <>
      {view === 'landing' && <LandingPage onNavigate={setView} />}
      {view === 'auth' && <AuthPage onAuth={handleAuth} onNavigate={setView} />}
      {view === 'roleSelection' && (
        <RoleSelection
          onRoleSelect={handleRoleSelect}
          onLogout={handleLogout}
          user={user}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          userRole={userRole}
          onChangeRole={handleChangeRole}
        />
      )}
    </>
  );
}

export default App;