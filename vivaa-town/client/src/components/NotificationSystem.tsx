import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  icon?: string;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

// Context for sharing notifications across components
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  showTransactionNotification: (from: string, to: string, amount: number, currency: string) => void;
  showSalaryNotification: (student: string, amount: number, currency: string) => void;
  showCreditScoreNotification: (student: string, change: number, newScore: number, reason: string) => void;
  showAchievementNotification: (student: string, achievement: string) => void;
  showEventNotification: (title: string, message: string) => void;
  showWarningNotification: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    console.log('addNotification 호출됨:', notification);
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showTransactionNotification = (from: string, to: string, amount: number, currency: string) => {
    console.log('showTransactionNotification 호출됨:', { from, to, amount, currency });
    addNotification({
      type: 'success',
      title: '💸 새로운 거래 발생!',
      message: `${from}이(가) ${to}에게 ${amount.toLocaleString()}${currency}을 보냈습니다.`,
      icon: '💸',
      duration: 4000
    });
  };

  const showSalaryNotification = (student: string, amount: number, currency: string) => {
    addNotification({
      type: 'success',
      title: '💰 급여 지급!',
      message: `${student}에게 ${amount.toLocaleString()}${currency}이 지급되었습니다.`,
      icon: '💰',
      duration: 4000
    });
  };

  const showCreditScoreNotification = (student: string, change: number, newScore: number, reason: string) => {
    console.log('showCreditScoreNotification 호출됨:', { student, change, newScore, reason });
    const isImprovement = change > 0;
    addNotification({
      type: isImprovement ? 'success' : 'warning',
      title: isImprovement ? '📈 신용점수 상승!' : '📉 신용점수 하락',
      message: `${student}의 신용점수가 ${Math.abs(change)}점 ${isImprovement ? '상승' : '하락'}했습니다 (${newScore}점). 사유: ${reason}`,
      icon: isImprovement ? '📈' : '📉',
      duration: 5000
    });
  };

  const showAchievementNotification = (student: string, achievement: string) => {
    console.log('showAchievementNotification 호출됨:', { student, achievement });
    addNotification({
      type: 'info',
      title: '🏆 업적 달성!',
      message: `${student}이(가) "${achievement}" 업적을 달성했습니다!`,
      icon: '🏆',
      duration: 6000
    });
  };

  const showEventNotification = (title: string, message: string) => {
    addNotification({
      type: 'info',
      title: '📢 ' + title,
      message,
      icon: '📢',
      duration: 7000
    });
  };

  const showWarningNotification = (title: string, message: string) => {
    addNotification({
      type: 'warning',
      title: '⚠️ ' + title,
      message,
      icon: '⚠️',
      duration: 8000
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        showTransactionNotification,
        showSalaryNotification,
        showCreditScoreNotification,
        showAchievementNotification,
        showEventNotification,
        showWarningNotification,
      }}
    >
      {children}
      <NotificationSystem
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

const NotificationItem = ({ notification, onRemove }: {
  notification: Notification;
  onRemove: (id: string) => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(notification.id);
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onRemove]);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '💡';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.15 } }}
      className={`max-w-sm w-full bg-white shadow-md rounded-xl pointer-events-auto border overflow-hidden ${getTypeStyles(notification.type)}`}
    >
      <div className="p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="text-lg">
              {notification.icon || getTypeIcon(notification.type)}
            </div>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => onRemove(notification.id)}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function NotificationSystem({ notifications, removeNotification }: NotificationSystemProps) {
  return (
    <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Hook for using notifications context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationSystem;