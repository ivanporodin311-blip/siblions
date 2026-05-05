import { getApiConfig } from './global.js';

/**
 * Обмен кода OAuth на токен (Логин)
 */
export const fetchAuth = async (oauthData) => {
  const config = getApiConfig();
  const baseURL = config.baseURL;
  const endpoint = import.meta.env.VITE_REF_POST_LOGIN;
  const fullUrl = `${baseURL}${endpoint}`;
  
  console.log('🔍 baseURL:', baseURL);
  console.log('🔍 endpoint:', endpoint);
  console.log('🔍 fullUrl:', fullUrl);
  
  const requestBody = {
    code: oauthData.code,
    codeVerifier: oauthData.codeVerifier || oauthData.code_ver || oauthData.code_verifier
  };

  console.log('🚀 [fetchAuth] Отправка запроса на логин...');
  console.log('📦 Payload:', requestBody);

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        ...config.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      credentials: 'include'
    });
    
    console.log('📥 [fetchAuth] Статус:', response.status);
    
    // Логируем все заголовки
    console.log('📋 ВСЕ ЗАГОЛОВКИ ОТВЕТА:');
    for (let pair of response.headers.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    const setCookie = response.headers.get('set-cookie');
    console.log('🍪 Set-Cookie из ответа:', setCookie);
    
    // Принудительная установка кук
    if (setCookie) {
      console.log('🍪 [fetchAuth] Принудительно устанавливаю куки...');
      const cookies = setCookie.split(',').map(c => c.trim());
      cookies.forEach(cookie => {
        const mainCookie = cookie.split(';')[0];
        // Устанавливаем без Secure для localhost
        document.cookie = mainCookie + '; path=/; max-age=2592000';
        console.log('✅ [fetchAuth] Кука установлена:', mainCookie);
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка входа (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Данные пользователя:', data);
    
    // Проверяем refresh_token в теле ответа
    if (data.refresh_token) {
      document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=2592000`;
      console.log('✅ refresh_token из тела сохранён');
    }
    
    // Проверяем куки после установки
    console.log('🍪 Куки после логина:', document.cookie);
    
    return data;
  } catch (error) {
    console.error('❌ [fetchAuth] Критическая ошибка:', error);
    throw error;
  }
};

/**
 * Обновление сессии (Refresh)
 */
export const fetchAuthRefresh = async () => {
  const config = getApiConfig();
  const url = `${config.baseURL}${import.meta.env.VITE_REF_POST_RELOGIN}`;
  
  console.log('🍪 Куки перед refresh:', document.cookie);
  console.log('📍 URL refresh:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: config.headers,
      credentials: 'include'
    });

    console.log('📥 refresh статус:', response.status);
    
    // Логируем все заголовки refresh
    console.log('📋 ВСЕ ЗАГОЛОВКИ REFRESH:');
    for (let pair of response.headers.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    const setCookie = response.headers.get('set-cookie');
    console.log('🍪 Set-Cookie из refresh:', setCookie);
    
    // Принудительно сохраняем куки из refresh
    if (setCookie) {
      const cookies = setCookie.split(',').map(c => c.trim());
      cookies.forEach(cookie => {
        const mainCookie = cookie.split(';')[0];
        document.cookie = mainCookie + '; path=/; max-age=2592000';
        console.log('✅ Кука из refresh установлена:', mainCookie);
      });
    }
    
    // Проверяем куки после refresh
    console.log('🍪 Куки после refresh:', document.cookie);
    
    return response.ok;
  } catch (error) {
    console.error('❌ [fetchAuthRefresh] Ошибка рефреша:', error);
    return false;
  }
};

/**
 * Получение данных текущего пользователя (/me)
 */
export const getMeAuth = async () => {
  const config = getApiConfig();
  const url = `${config.baseURL}${import.meta.env.VITE_REF_GET_ME_DATA}`;
  
  console.log('🍪 Куки перед /me:', document.cookie);
  console.log('📍 URL /me:', url);
  
  try {
    const response = await fetch(url, {
      headers: config.headers,
      credentials: 'include'
    });

    console.log('📥 /me статус:', response.status);
    
    if (!response.ok) {
      console.warn('⚠️ [getMeAuth] Сессия не активна или куки отсутствуют');
      return false;
    }
    const data = await response.json();
    console.log('✅ /me данные:', data);
    return data;
  } catch (error) {
    console.error('❌ [getMeAuth] Ошибка запроса профиля:', error);
    return false;
  }
};

/**
 * Выход из системы (с подробным логированием)
 */
export const logout = async () => {
  const config = getApiConfig();
  const url = `${config.baseURL}${import.meta.env.VITE_REF_POST_LOGOUT}`;
  
  console.log('========================================');
  console.log('📤 LOGOUT ЗАПРОС ОТПРАВЛЯЕТСЯ');
  console.log('📍 URL:', url);
  console.log('========================================');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: config.headers,
      credentials: 'include'
    });
    
    console.log('========================================');
    console.log('📥 LOGOUT ОТВЕТ ПОЛУЧЕН');
    console.log('📊 Status:', response.status);
    
    // Проверяем все заголовки ответа
    console.log('📋 ВСЕ ЗАГОЛОВКИ ОТВЕТА:');
    for (let pair of response.headers.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    const setCookieHeader = response.headers.get('set-cookie');
    console.log('🍪 Set-Cookie заголовок:', setCookieHeader);
    
    // Принудительно удаляем куки при выходе
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'app_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    if (!setCookieHeader) {
      console.warn('⚠️ Бэкенд НЕ прислал Set-Cookie заголовок!');
    } else {
      console.log('✅ Бэкенд прислал куки:', setCookieHeader);
    }
    
    console.log('🍪 Куки после logout:', document.cookie);
    console.log('========================================');
    
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