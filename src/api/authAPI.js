import { getApiConfig } from './global.js';

/**
 * Обмен кода OAuth на токен (Логин)
 */
export const fetchAuth = async (oauthData) => {
  const config = getApiConfig();
  const baseURL = config.baseURL;
  const endpoint = import.meta.env.VITE_REF_POST_LOGIN;
  const fullUrl = `${baseURL}${endpoint}`;

  const requestBody = {
    code: oauthData.code,
    codeVerifier: oauthData.codeVerifier || oauthData.code_ver || oauthData.code_verifier
  };

  try {
    console.log('🚀 [fetchAuth] Отправка запроса на логин...', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        ...config.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      credentials: 'include' // ✅ Браузер сам сохранит куки
    });

    console.log('📥 [fetchAuth] Статус:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка входа (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Данные пользователя получены');

    // Если бэкенд возвращает refresh_token в теле ответа
    if (data.refresh_token) {
      document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=2592000`;
    }

    return data;
  } catch (error) {
    console.error('❌ [fetchAuth] Критическая ошибка:', error);
    throw error;
  }
};

/**
 * Обновление сессии и получение данных пользователя (Refresh + Me)
 * Возвращает данные пользователя если сессия валидна
 */
export const fetchAuthRefresh = async () => {
  const config = getApiConfig();
  const url = `${config.baseURL}${import.meta.env.VITE_REF_POST_RELOGIN}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: config.headers,
      credentials: 'include'
    });

    console.log('📥 refresh статус:', response.status);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    console.log('✅ Сессия обновлена, данные пользователя получены');
    return data;
  } catch (error) {
    console.error('❌ [fetchAuthRefresh] Ошибка рефреша:', error);
    return null;
  }
};

/**
 * Выход из системы
 */
export const logout = async () => {
  const config = getApiConfig();
  const url = `${config.baseURL}${import.meta.env.VITE_REF_POST_LOGOUT}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: config.headers,
      credentials: 'include'
    });

    // Очищаем куки, доступные через JS
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'app_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    if (!response.ok) {
      throw new Error(`Сервер не смог завершить сессию: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('❌ ОШИБКА LOGOUT:', error);
    throw error;
  }
};

/**
 * Получение данных профиля по UID
 */
export const getUserDataByUID = async (code) => {
  const config = getApiConfig();
  try {
    const response = await fetch(`${config.baseURL}${import.meta.env.VITE_REF_GET_CURRENT_USER}${code}`, {
      headers: config.headers,
    });
    if (!response.ok) throw new Error('Ошибка получения данных по UID');
    return await response.json();
  } catch (error) {
    console.error('❌ [getUserDataByUID] Ошибка:', error);
    throw error;
  }
};