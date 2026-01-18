import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/common';

export function Login() {
  const { login, isPasswordSet, setInitialPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(!isPasswordSet);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('パスワードを入力してください');
      return;
    }

    const success = login(password);
    if (!success) {
      setError('パスワードが正しくありません');
      setPassword('');
    }
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('パスワードを入力してください');
      return;
    }

    if (password.length < 4) {
      setError('パスワードは4文字以上で設定してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setInitialPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              請求書管理システム
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {isSettingPassword ? '初期パスワードを設定してください' : 'ログインしてください'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={isSettingPassword ? handleSetPassword : handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                label={isSettingPassword ? '新しいパスワード' : 'パスワード'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                autoFocus
              />
            </div>

            {isSettingPassword && (
              <div>
                <Input
                  type="password"
                  label="パスワード（確認）"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワードを再入力"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full">
              {isSettingPassword ? 'パスワードを設定' : 'ログイン'}
            </Button>
          </form>

          {/* Skip option for first time */}
          {!isPasswordSet && !isSettingPassword && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSettingPassword(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                パスワードを設定する
              </button>
            </div>
          )}

          {isSettingPassword && isPasswordSet && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSettingPassword(false)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                ログインに戻る
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          社内専用システム
        </p>
      </div>
    </div>
  );
}
