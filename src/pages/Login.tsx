import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';
import { Button, Input } from '../components/common';
import type { Language } from '../i18n';

export function Login() {
  const { login, isPasswordSet, setInitialPassword } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { addActivityLog } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(!isPasswordSet);

  // Localized labels
  const labels = {
    appName: t('nav.appName'),
    setInitialPassword: language === 'ja' ? '初期パスワードを設定してください' : language === 'zh' ? '请设置初始密码' : 'Please set your initial password',
    pleaseLogin: language === 'ja' ? 'ログインしてください' : language === 'zh' ? '请登录' : 'Please log in',
    newPassword: language === 'ja' ? '新しいパスワード' : language === 'zh' ? '新密码' : 'New Password',
    password: language === 'ja' ? 'パスワード' : language === 'zh' ? '密码' : 'Password',
    enterPassword: language === 'ja' ? 'パスワードを入力' : language === 'zh' ? '输入密码' : 'Enter password',
    confirmPassword: language === 'ja' ? 'パスワード（確認）' : language === 'zh' ? '确认密码' : 'Confirm Password',
    reenterPassword: language === 'ja' ? 'パスワードを再入力' : language === 'zh' ? '重新输入密码' : 'Re-enter password',
    setPassword: language === 'ja' ? 'パスワードを設定' : language === 'zh' ? '设置密码' : 'Set Password',
    login: language === 'ja' ? 'ログイン' : language === 'zh' ? '登录' : 'Login',
    setPasswordLink: language === 'ja' ? 'パスワードを設定する' : language === 'zh' ? '设置密码' : 'Set password',
    backToLogin: language === 'ja' ? 'ログインに戻る' : language === 'zh' ? '返回登录' : 'Back to login',
    footer: language === 'ja' ? '社内専用システム' : language === 'zh' ? '内部专用系统' : 'Internal System',
    errorEnterPassword: language === 'ja' ? 'パスワードを入力してください' : language === 'zh' ? '请输入密码' : 'Please enter password',
    errorIncorrectPassword: language === 'ja' ? 'パスワードが正しくありません' : language === 'zh' ? '密码不正确' : 'Incorrect password',
    errorMinChars: language === 'ja' ? 'パスワードは4文字以上で設定してください' : language === 'zh' ? '密码至少4位字符' : 'Password must be at least 4 characters',
    errorNoMatch: language === 'ja' ? 'パスワードが一致しません' : language === 'zh' ? '密码不匹配' : 'Passwords do not match',
  };

  const languages: { value: Language; label: string }[] = [
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'EN' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError(labels.errorEnterPassword);
      return;
    }

    const success = login(password);
    if (success) {
      addActivityLog('login', 'ログイン');
    } else {
      setError(labels.errorIncorrectPassword);
      setPassword('');
    }
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError(labels.errorEnterPassword);
      return;
    }

    if (password.length < 4) {
      setError(labels.errorMinChars);
      return;
    }

    if (password !== confirmPassword) {
      setError(labels.errorNoMatch);
      return;
    }

    setInitialPassword(password);
    addActivityLog('login', '初回ログイン（パスワード設定）');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-center gap-2 mb-4">
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => setLanguage(lang.value)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                language === lang.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {labels.appName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {isSettingPassword ? labels.setInitialPassword : labels.pleaseLogin}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={isSettingPassword ? handleSetPassword : handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                label={isSettingPassword ? labels.newPassword : labels.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={labels.enterPassword}
                autoFocus
              />
            </div>

            {isSettingPassword && (
              <div>
                <Input
                  type="password"
                  label={labels.confirmPassword}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={labels.reenterPassword}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full">
              {isSettingPassword ? labels.setPassword : labels.login}
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
                {labels.setPasswordLink}
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
                {labels.backToLogin}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {labels.footer}
        </p>
      </div>
    </div>
  );
}
