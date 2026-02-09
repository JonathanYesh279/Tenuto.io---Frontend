import React, { useState, useEffect } from 'react';
import { featureFlagService } from '../services/featureFlagService';

interface NotificationProps {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary';
  }>;
  dismissible?: boolean;
  autoHide?: boolean;
  duration?: number;
}

const BagrutDeploymentNotification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  actions,
  dismissible = true,
  autoHide = false,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  if (!isVisible) return null;

  const getNotificationStyles = () => {
    const baseStyles = "fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4 p-4 rounded-lg shadow-lg z-50 border";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={getNotificationStyles()}>
      <div className="flex">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>
        <div className="mr-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="mt-1 text-sm opacity-90">{message}</p>
          
          {actions && actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    action.variant === 'primary'
                      ? type === 'error'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : type === 'warning'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : type === 'success'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {dismissible && (
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsVisible(false)}
              className="inline-flex text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const BagrutSystemNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: string }>>([]);

  useEffect(() => {
    const handleSystemRollback = (event: CustomEvent) => {
      const { type, message } = event.detail;
      
      addNotification({
        id: `rollback-${Date.now()}`,
        type: 'warning',
        title: 'שינוי במערכת הבגרויות',
        message: message,
        actions: [
          {
            label: 'רענן דף',
            action: () => window.location.reload(),
            variant: 'primary'
          }
        ],
        dismissible: false
      });
    };

    const handleEmergencyRecovery = (event: CustomEvent) => {
      const { message } = event.detail;
      
      addNotification({
        id: `recovery-${Date.now()}`,
        type: 'error',
        title: 'מצב חירום במערכת',
        message: message,
        actions: [
          {
            label: 'פנה למנהל המערכת',
            action: () => {
              window.open('mailto:admin@conservatory.example', '_blank');
            },
            variant: 'primary'
          }
        ],
        dismissible: false
      });
    };

    const handleDeploymentUpdate = () => {
      const deploymentStatus = featureFlagService.getBagrutDeploymentStatus();
      
      if (deploymentStatus.currentPhase > 0 && !deploymentStatus.isFullyDeployed) {
        const phase = deploymentStatus.currentPhase;
        const phases = featureFlagService.getBagrutDeploymentPhases();
        const currentPhaseConfig = Object.values(phases)[phase - 1];
        
        addNotification({
          id: `deployment-${phase}`,
          type: 'info',
          title: 'עדכון מערכת הבגרויות',
          message: `שלב ${phase}: ${currentPhaseConfig?.description || 'משדרגים את המערכת'}`,
          actions: [
            {
              label: 'למד עוד',
              action: () => {
                window.open('#bagrut-help', '_self');
              },
              variant: 'secondary'
            }
          ],
          autoHide: true,
          duration: 10000
        });
      }
    };

    window.addEventListener('bagrutSystemRollback', handleSystemRollback as EventListener);
    window.addEventListener('bagrutEmergencyRecovery', handleEmergencyRecovery as EventListener);

    const deploymentCheckInterval = setInterval(handleDeploymentUpdate, 300000);

    handleDeploymentUpdate();

    return () => {
      window.removeEventListener('bagrutSystemRollback', handleSystemRollback as EventListener);
      window.removeEventListener('bagrutEmergencyRecovery', handleEmergencyRecovery as EventListener);
      clearInterval(deploymentCheckInterval);
    };
  }, []);

  const addNotification = (notification: NotificationProps & { id: string }) => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === notification.id);
      if (exists) return prev;
      
      return [...prev.slice(-4), notification];
    });

    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
      {notifications.map(notification => (
        <BagrutDeploymentNotification
          key={notification.id}
          {...notification}
          actions={notification.actions?.map(action => ({
            ...action,
            action: () => {
              action.action();
              if (notification.dismissible !== false) {
                removeNotification(notification.id);
              }
            }
          }))}
        />
      ))}
    </div>
  );
};

export default BagrutSystemNotifications;
export { BagrutDeploymentNotification };