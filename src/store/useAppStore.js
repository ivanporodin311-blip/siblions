import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthSlice } from './authSlice'; // Путь к твоему файлу

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Метод уведомления, который запрашивает твой слайс
      notify: (type) => {
        console.log(`State updated for: ${type}`);
      },

      // Подключаем авторизацию
      ...useAuthSlice(set, get),
    }),
    {
      name: 'auth-storage', // ключ для localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        authSlice: state.authSlice,
      }),
    }
  )
);