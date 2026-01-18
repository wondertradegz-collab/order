import { useAutoBackup } from '../../hooks/useAutoBackup';

export function BackupNotification() {
  const { notification, dismissNotification, isSending } = useAutoBackup();

  if (!notification?.show) return null;

  const bgColor = notification.type === 'success'
    ? 'bg-green-500'
    : notification.type === 'error'
    ? 'bg-red-500'
    : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${bgColor} text-white rounded-lg shadow-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {notification.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : notification.type === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-2 flex gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={isSending}
                  className="text-sm font-medium bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={dismissNotification}
          className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
