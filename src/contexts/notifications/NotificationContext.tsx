import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationPreferences } from '../../types/notifications';
import { NotificationService } from '../../services/notificationService';

interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    movieRecommendations: true,
    moodSuggestions: true,
    watchReminders: true,
  });

  useEffect(() => {
    const loadPreferences = async () => {
      const savedPreferences = await NotificationService.getPreferences();
      if (savedPreferences) {
        setPreferences(savedPreferences);
      }
    };
    loadPreferences();
  }, []);

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    await NotificationService.updatePreferences(newPreferences);
    setPreferences(newPreferences);
  };

  return (
    <NotificationContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 