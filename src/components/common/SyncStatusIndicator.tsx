import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function SyncStatusIndicator() {
  const { syncStatus, isCloudEnabled, lastSyncTime, forceSync } = useApp();
  const { t } = useLanguage();

  if (!isCloudEnabled) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span>{t('sync.local')}</span>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'bg-green-500';
      case 'syncing':
        return 'bg-blue-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      case 'offline':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return t('sync.synced');
      case 'syncing':
        return t('sync.syncing');
      case 'error':
        return t('sync.error');
      case 'offline':
        return t('sync.offline');
      default:
        return t('sync.waiting');
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={forceSync}
        disabled={syncStatus === 'syncing'}
        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
        title={t('sync.clickToSync')}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>{getStatusText()}</span>
      </button>
      {lastSyncTime && syncStatus === 'synced' && (
        <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-4">
          {t('sync.lastSync')}: {formatTime(lastSyncTime)}
        </span>
      )}
    </div>
  );
}
