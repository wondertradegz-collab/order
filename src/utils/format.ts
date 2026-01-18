// 金額フォーマット
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

// 数値フォーマット（カンマ区切り）
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}

// 日付フォーマット
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

// 今日の日付をYYYY-MM-DD形式で取得
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ステータスの日本語表示
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '下書き',
    sent: '送付済み',
    paid: '入金済み',
    overdue: '期限超過',
    cancelled: 'キャンセル',
  };
  return labels[status] || status;
}

// ステータスの色
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// 書類タイプの日本語表示
export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    quotation: '見積書',
    invoice: '請求書',
    receipt: '領収書',
  };
  return labels[type] || type;
}

// 書類タイプの色
export function getDocumentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    quotation: 'bg-purple-100 text-purple-800',
    invoice: 'bg-orange-100 text-orange-800',
    receipt: 'bg-green-100 text-green-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}
