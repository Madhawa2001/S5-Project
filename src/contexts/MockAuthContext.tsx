import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, credentials: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded test accounts
const MOCK_ACCOUNTS = [
  {
    id: 'admin-001',
    email: 'admin@test.com',
    password: 'admin123',
    full_name: 'Admin User',
    role: 'admin' as UserRole,
    professional_credentials: 'System Administrator',
    approval_status: 'approved' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'doctor-001',
    email: 'doctor@test.com',
    password: 'doctor123',
    full_name: 'Dr. Sarah Johnson',
    role: 'doctor' as UserRole,
    professional_credentials: 'MD, Board Certified OB/GYN',
    approval_status: 'approved' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'lab-001',
    email: 'lab@test.com',
    password: 'lab123',
    full_name: 'Lab Assistant Mike',
    role: 'lab_assistant' as UserRole,
    professional_credentials: 'Certified Medical Laboratory Technician',
    approval_status: 'approved' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'doctor-002',
    email: 'doctor2@test.com',
    password: 'doctor123',
    full_name: 'Dr. John Smith',
    role: 'doctor' as UserRole,
    professional_credentials: 'MD, Reproductive Medicine Specialist',
    approval_status: 'pending' as const, // Pending approval for testing
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('mockUser');
      }
    }
    setIsLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const account = MOCK_ACCOUNTS.find(
      acc => acc.email === email && acc.password === password
    );

    if (!account) {
      return { error: 'Invalid email or password' };
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = account;
    
    setUser(userWithoutPassword as User);
    localStorage.setItem('mockUser', JSON.stringify(userWithoutPassword));

    console.log('✅ Logged in as:', account.email, '(Role:', account.role + ')');
    
    return { error: null };
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    credentials: string
  ) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if email already exists
    const existingAccount = MOCK_ACCOUNTS.find(acc => acc.email === email);
    if (existingAccount) {
      return { error: 'Email already registered' };
    }

    console.log('✅ Mock signup successful (but not persisted):', {
      email,
      fullName,
      role,
      credentials,
    });

    // In mock mode, we don't actually create accounts
    // Just show success message
    return { error: null };
  }

  async function signOut() {
    setUser(null);
    localStorage.removeItem('mockUser');
    console.log('✅ Logged out');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}