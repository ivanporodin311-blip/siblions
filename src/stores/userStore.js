// stores/userStore.js
import { create } from 'zustand';

const API_BASE_URL = 'https://songeng.voold.online/api';

const useUserStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchAllUsers: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      const data = await response.json();
      const usersArray = Array.isArray(data) ? data : (data.users || data.data || []);
      
      set({ users: usersArray, loading: false });
      return usersArray;
      
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      set({ error: error.message, loading: false, users: [] });
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));

export default useUserStore;