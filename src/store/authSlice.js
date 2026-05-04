import CryptoJS from 'crypto-js';
import { fetchAuth, fetchAuthRefresh, getMeAuth, logout } from '../api/authAPI.js';
import { oauthCodeHandler } from '../Services/authHandler.js';

export const useAuthSlice = (set, get) => ({
  authSlice: {
    isAuthenticated: false,
    user: null,
    type: 'auth',
    isLoading: false,
    error: null,
  },
  authSliceMethods: {

    checkAuthentication: async (query = '') => {
      const { isAuthenticated } = get().authSlice;
      const { handleAuthError, tryMeAuth, refreshLogin, tryOAuth } = get().authSliceMethods;
      
      if (isAuthenticated) return true;

      try {
        // 1. Приоритет: Обработка кода OAuth из URL
        if (query && query.includes('code=')) {
          const oauthStatus = await tryOAuth(query);
          if (oauthStatus) {
            await tryMeAuth();
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
          }
        }

        // 2. Проверка живой сессии (по кукам через /me)
        // const isMe = await tryMeAuth();
        // if (isMe) return true;

        // 3. Попытка рефреша сессии
        // const isRefreshed = await refreshLogin();
        // if (isRefreshed) {
        //   return await tryMeAuth();
        // }

        return false;
      } catch (error) {
        handleAuthError(error);
        return false;
      }
    },

    refreshLogin: async () => {
      const { startAuthLoading, endAuthLoading } = get().authSliceMethods;
      startAuthLoading();
      try {
        const success = await fetchAuthRefresh();
        return success;
      } catch (error) {
        return false;
      } finally {
        endAuthLoading();
      }
    },

    tryMeAuth: async () => {
      const { startAuthLoading, endAuthLoading, setAuthenticated } = get().authSliceMethods;
      startAuthLoading();
      try {
        const userData = await getMeAuth();
        if (!userData || typeof userData !== 'object') return false;
        
        await setAuthenticated(userData);
        return true;
      } catch (error) {
        return false;
      } finally {
        endAuthLoading();
      }
    },

    tryOAuth: async (query) => {
      const { endAuthLoading, handleAuthError, startAuthLoading, fetchAndSetAuth } = get().authSliceMethods;
      
      // Вызываем хендлер, который забирает code из URL и verifier из хранилища
      const authPayload = oauthCodeHandler(query);
      
      if (!authPayload) {
        console.error("❌ Данные OAuth не найдены или state не совпал");
        return false;
      }

      startAuthLoading();
      try {
        // Прокидываем payload в fetchAndSetAuth
        const authResult = await fetchAndSetAuth(authPayload);
        
        // ✅ СОХРАНЯЕМ ТОКЕН ПОСЛЕ УСПЕШНОЙ АВТОРИЗАЦИИ
        if (authResult && authResult.token) {
          localStorage.setItem('auth_token', authResult.token);
          console.log('✅ Токен сохранён в localStorage');
        } else if (authResult && authResult.user && authResult.user.token) {
          localStorage.setItem('auth_token', authResult.user.token);
          console.log('✅ Токен сохранён из user объекта');
        }
        
        localStorage.setItem('auth', 'true');
        return true;
      } catch (error) {
        handleAuthError(error);
        return false;
      } finally {
        endAuthLoading();
      }
    },

    setAuthenticated: async (userData) => {
      const { notifyAuthState } = get().authSliceMethods;
      
      // ✅ СОХРАНЯЕМ ТОКЕН ЕСЛИ ОН ЕСТЬ В userData
      if (userData && userData.token) {
        localStorage.setItem('auth_token', userData.token);
        console.log('✅ Токен сохранён в setAuthenticated');
      } else if (userData && userData.user && userData.user.token) {
        localStorage.setItem('auth_token', userData.user.token);
        console.log('✅ Токен сохранён из user объекта в setAuthenticated');
      }
      
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

    fetchAndSetAuth: async (authPayload) => {
      const { setAuthenticated } = get().authSliceMethods;
      // Отправляем данные в API (там уже настроен маппинг на codeVerifier)
      const authData = await fetchAuth(authPayload);
      
      if (!authData) throw new Error("Сервер не вернул данные пользователя");
      
      // ✅ Возвращаем authData для дальнейшей обработки токена
      await setAuthenticated(authData);
      return authData; // Возвращаем данные для tryOAuth
    },

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
        authSlice: { ...state.authSlice, error: error.message || 'Ошибка аутентификации' } 
      }));
    },

    notifyAuthState: () => {
      get().notify(get().authSlice.type);
    },

    getUserData: () => {
      const encryptedUser = get().authSlice.user;
      if (!encryptedUser) return null;
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedUser, import.meta.env.VITE_SECRET_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
      } catch (error) {
        return null;
      }
    },

    logout: async () => {
      console.log('🔐 [authSlice] logout инициирован');
      
      try { 
        const result = await logout();
        console.log('✅ [authSlice] API logout успех:', result);
      } catch (e) {
        console.error('❌ [authSlice] API logout провалился, но чистим стейт:', e);
      }
      
      // Полная зачистка всех следов
      localStorage.removeItem('auth');
      localStorage.removeItem('auth_token'); // ✅ Удаляем токен
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
      
      console.log('🔓 [authSlice] Состояние сброшено. Редирект должен сделать компонент.');
    },

    checkAuthStatus: function () {
      const state = get();
      return {
        isLoading: state.authSlice.isLoading,
        error: state.authSlice.error,
      };
    },
  }
});

function _encryptData(data) {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    import.meta.env.VITE_SECRET_KEY
  ).toString();
}