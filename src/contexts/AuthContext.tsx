import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  isPasswordSet: boolean;
  setInitialPassword: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = 'invoice_app_auth';
const PASSWORD_STORAGE_KEY = 'invoice_app_password';

// シンプルなハッシュ関数（本番環境では適切なハッシュライブラリを使用）
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordSet, setIsPasswordSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時に認証状態とパスワード設定を確認
  useEffect(() => {
    const storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const storedPassword = localStorage.getItem(PASSWORD_STORAGE_KEY);

    setIsPasswordSet(!!storedPassword);
    setIsAuthenticated(storedAuth === 'true');
    setIsLoading(false);
  }, []);

  const login = (password: string): boolean => {
    const storedHash = localStorage.getItem(PASSWORD_STORAGE_KEY);

    if (!storedHash) {
      // パスワード未設定の場合は常に成功
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }

    const inputHash = simpleHash(password);
    if (inputHash === storedHash) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const setInitialPassword = (password: string) => {
    const hash = simpleHash(password);
    localStorage.setItem(PASSWORD_STORAGE_KEY, hash);
    setIsPasswordSet(true);
    setIsAuthenticated(true);
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
  };

  const changePassword = (currentPassword: string, newPassword: string): boolean => {
    const storedHash = localStorage.getItem(PASSWORD_STORAGE_KEY);

    // 現在のパスワードを確認
    if (storedHash && simpleHash(currentPassword) !== storedHash) {
      return false;
    }

    // 新しいパスワードを保存
    const newHash = simpleHash(newPassword);
    localStorage.setItem(PASSWORD_STORAGE_KEY, newHash);
    setIsPasswordSet(true);
    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      changePassword,
      isPasswordSet,
      setInitialPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
