import { create } from 'zustand';
import { useAuthSlice } from './authSlice'; // Путь к твоему файлу

export const useAppStore = create((set, get) => ({
  // Метод уведомления, который запрашивает твой слайс
  notify: (type) => {
    console.log(`State updated for: ${type}`);
  },

  // Подключаем авторизацию
  ...useAuthSlice(set, get),
}));