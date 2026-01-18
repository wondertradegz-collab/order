import { useState, useRef, useEffect } from 'react';

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  min?: string;
  max?: string;
}

// 日付文字列を正規化（YYYY-MM-DD形式に変換）
function normalizeDate(input: string): string | null {
  if (!input) return null;

  // 既にYYYY-MM-DD形式
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  // YYYY/MM/DD形式
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(input)) {
    const [year, month, day] = input.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 年月日（和暦風: 2024年1月15日）
  const jpMatch = input.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
  if (jpMatch) {
    const [, year, month, day] = jpMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // MM/DD/YYYY or DD/MM/YYYY (月が12以下で日が12超えなら日/月/年と判断)
  const slashMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);

    // 日本ではMM/DD/YYYYが一般的ではないため、数字が大きい方を日として扱う
    if (firstNum > 12 && secondNum <= 12) {
      // DD/MM/YYYY
      return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
    } else {
      // MM/DD/YYYY
      return `${year}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
    }
  }

  // YYYYMMDD形式
  if (/^\d{8}$/.test(input)) {
    return `${input.slice(0, 4)}-${input.slice(4, 6)}-${input.slice(6, 8)}`;
  }

  return null;
}

// 日付の妥当性チェック
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// 表示用フォーマット（YYYY/MM/DD）
function formatForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  return dateStr;
}

export function DateInput({
  label,
  value,
  onChange,
  placeholder = 'YYYY/MM/DD',
  className = '',
  required,
  min,
  max,
}: DateInputProps) {
  const [textValue, setTextValue] = useState(formatForDisplay(value));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'calendar'>('text');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarInputRef = useRef<HTMLInputElement>(null);

  // 外部からvalueが変更された場合に同期
  useEffect(() => {
    setTextValue(formatForDisplay(value));
  }, [value]);

  // 外部クリックでカレンダーを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    setError(null);

    // 入力中は変換しない（フォーカスが外れた時に変換）
  };

  const handleTextBlur = () => {
    if (!textValue) {
      onChange('');
      return;
    }

    const normalized = normalizeDate(textValue);
    if (normalized && isValidDate(normalized)) {
      onChange(normalized);
      setTextValue(formatForDisplay(normalized));
      setError(null);
    } else {
      setError('無効な日付形式です');
    }
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setTextValue(formatForDisplay(newValue));
    setError(null);
    setIsCalendarOpen(false);
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
    if (!isCalendarOpen) {
      setTimeout(() => {
        calendarInputRef.current?.showPicker?.();
      }, 50);
    }
  };

  const switchMode = () => {
    setInputMode(inputMode === 'text' ? 'calendar' : 'text');
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div ref={containerRef} className="relative">
        <div className="flex gap-1">
          {/* メイン入力エリア */}
          {inputMode === 'text' ? (
            <input
              type="text"
              value={textValue}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              placeholder={placeholder}
              className={`flex-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'
              } focus:outline-none focus:ring-2`}
            />
          ) : (
            <input
              type="date"
              value={value}
              onChange={handleCalendarChange}
              min={min}
              max={max}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {/* カレンダーボタン（テキストモード時のみ） */}
          {inputMode === 'text' && (
            <button
              type="button"
              onClick={toggleCalendar}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
              title="カレンダーから選択"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {/* モード切替ボタン */}
          <button
            type="button"
            onClick={switchMode}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors text-xs"
            title={inputMode === 'text' ? 'カレンダー入力に切替' : 'テキスト入力に切替'}
          >
            {inputMode === 'text' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
          </button>
        </div>

        {/* カレンダーポップアップ（テキストモードでカレンダーボタン押下時） */}
        {isCalendarOpen && inputMode === 'text' && (
          <div className="absolute z-50 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
            <input
              ref={calendarInputRef}
              type="date"
              value={value}
              onChange={handleCalendarChange}
              min={min}
              max={max}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* エラーメッセージ */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* ヒント */}
      {inputMode === 'text' && !error && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          例: 2024/01/15, 2024-01-15, 2024年1月15日
        </p>
      )}
    </div>
  );
}
