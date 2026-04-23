import { create } from 'zustand';
import CryptoJS from 'crypto-js';
import { fetchAuth, fetchAuthRefresh, logout } from '../api/authAPI.js';
import { oauthCodeHandler } from '../Services/authHandler.js';

export const useAppStore = create((set, get) => ({
  // === Auth State ===
  authSlice: {
    isAuthenticated: false,
    user: null,
    type: 'auth',
    isLoading: false,
    error: null,
  },

  // === Auth Methods ===
  authSliceMethods: {
    /**
     * Проверка авторизации при загрузке приложения
     * Использует refresh endpoint для получения данных пользователя
     */
    checkAuthentication: async (query = '') => {
      const { isAuthenticated } = get().authSlice;
      const { handleAuthError, refreshLogin, tryOAuth, setAuthenticated } = get().authSliceMethods;

      // Если уже авторизован в стейте — выходим
      if (isAuthenticated) return true;

      try {
        // 1. Приоритет: Обработка кода OAuth из URL (первый вход)
        if (query && query.includes('code=')) {
          const oauthStatus = await tryOAuth(query);
          if (oauthStatus) {
            // Чистим URL после успешного входа
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
          }
        }

        // 2. Попытка рефреша сессии через куки с получением данных пользователя
        const userData = await refreshLogin();
        if (userData) {
          await setAuthenticated(userData);
          return true;
        }

        // Если ничего не сработало — пользователь не авторизован
        return false;
      } catch (error) {
        handleAuthError(error);
        return false;
      }
    },

    /**
     * Обновление сессии через refresh-эндпоинт с получением данных пользователя
     */
    refreshLogin: async () => {
      const { startAuthLoading, endAuthLoading } = get().authSliceMethods;
      startAuthLoading();
      try {
        const userData = await fetchAuthRefresh();
        return userData || null;
      } catch (error) {
        console.warn('⚠️ Refresh failed:', error);
        return null;
      } finally {
        endAuthLoading();
      }
    },

    /**
     * Обработка OAuth callback (code + state)
     */
    tryOAuth: async (query) => {
      const { endAuthLoading, handleAuthError, startAuthLoading, fetchAndSetAuth } = get().authSliceMethods;

      const authPayload = oauthCodeHandler(query);

      if (!authPayload) {
        console.error("❌ Данные OAuth не найдены или state не совпал");
        return false;
      }

      startAuthLoading();
      try {
        await fetchAndSetAuth(authPayload);
        return true;
      } catch (error) {
        handleAuthError(error);
        return false;
      } finally {
        endAuthLoading();
      }
    },

    /**
     * Установка авторизованного состояния + шифрование пользователя
     */
    setAuthenticated: async (userData) => {
      const { notifyAuthState } = get().authSliceMethods;
      const encryptedUser = _encryptData(userData);

      set((state) => ({
        authSlice: {
          ...state.authSlice,
          isAuthenticated: true,
          user: encryptedUser,
          isLoading: false,
          error: null
        }
      }));
      notifyAuthState();
    },

    /**
     * Вызов API логина и сохранение данных
     */
    fetchAndSetAuth: async (authPayload) => {
      const { setAuthenticated } = get().authSliceMethods;

      const authData = await fetchAuth(authPayload);

      if (!authData) {
        throw new Error("Сервер не вернул данные пользователя");
      }

      // Бэкенд может вернуть { user: {...} } или плоский объект
      const userData = authData.user || authData;
      await setAuthenticated(userData);
    },

    // === Утилиты состояния ===

    startAuthLoading: () => {
      set(state => ({
        authSlice: { ...state.authSlice, isLoading: true, error: null }
      }));
      get().authSliceMethods.notifyAuthState();
    },

    endAuthLoading: () => {
      set(state => ({
        authSlice: { ...state.authSlice, isLoading: false }
      }));
      get().authSliceMethods.notifyAuthState();
    },

    handleAuthError: (error) => {
      set(state => ({
        authSlice: {
          ...state.authSlice,
          error: error.message || 'Ошибка аутентификации',
          isLoading: false
        }
      }));
    },

    notifyAuthState: () => {
      get().notify(get().authSlice.type);
    },

    /**
     * Получение расшифрованных данных пользователя
     */
    getUserData: () => {
      const encryptedUser = get().authSlice.user;
      if (!encryptedUser) return null;
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedUser, import.meta.env.VITE_SECRET_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
      } catch (error) {
        console.error('❌ Ошибка расшифровки пользователя:', error);
        return null;
      }
    },

    /**
     * Выход из системы
     */
    logout: async () => {
      console.log('🔐 [authSlice] logout инициирован');

      try {
        await logout(); // Вызов API выхода
      } catch (e) {
        console.error('❌ [authSlice] API logout провалился, но чистим стейт:', e);
      }

      // Полная зачистка всех следов
      sessionStorage.removeItem('code_verifier');
      sessionStorage.removeItem('codeVerifier');
      sessionStorage.removeItem('oauth_state');

      set({
        authSlice: {
          isAuthenticated: false,
          user: null,
          type: 'auth',
          isLoading: false,
          error: null,
        }
      });

      console.log('🔓 [authSlice] Состояние сброшено');
    },

    /**
     * Проверка текущего статуса (для селекторов)
     */
    checkAuthStatus: function () {
      const state = get();
      return {
        isLoading: state.authSlice.isLoading,
        error: state.authSlice.error,
      };
    },
  },

  // === Notify method ===
  notify: (type) => {
    console.log(`State updated for: ${type}`);
  },
}));

// === Внутренние функции ===

function _encryptData(data) {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    import.meta.env.VITE_SECRET_KEY
  ).toString();
}