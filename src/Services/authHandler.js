/**
 * Запускает процесс PKCE авторизации через OAuth TPU
 */
export async function oauthRedirect() {
  console.log("Инициализация редиректа на ТПУ...");
  try {
    const clientId = import.meta.env.VITE_TPU_OAUTH_CLIENT_ID || 'siblions-app';
    if (!clientId) {
      throw new Error("VITE_TPU_OAUTH_CLIENT_ID не найден в .env файле");
    }

    // 1. Генерируем данные безопасности
    await _generateCodeVerifier();
    const codeChallenge = await _generateCodeChallenge();
    const state = _generateState();
    
    if (!codeChallenge || !state) {
      throw new Error("Не удалось сгенерировать параметры безопасности (PKCE/State)");
    }

    // 2. Формируем Redirect URI
    const redirectUri = window.location.origin;

    // 3. Формируем финальную ссылку (Теперь ПЕРЕД использованием)
    const authUrl = `https://oauth.tpu.ru/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`;

    console.log("Успешная генерация ссылки. Перенаправление на:", authUrl);
    
    // 4. Переходим
    window.location.href = authUrl;

  } catch (error) {
    console.error("Ошибка в oauthRedirect:", error.message);
    alert("Ошибка при входе: " + error.message);
  }
}

/**
 * Обрабатывает ответ от OAuth сервера (вызывается при возврате на сайт)
 */
export function oauthCodeHandler(query) {
  try {
    const searchParams = new URLSearchParams(query);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const codeVerifier = _getCodeVerifier();

    if (code && state && codeVerifier) {
      if (state === _getState()) {
        // Очистку пока закомментируем для отладки, если запрос упадет
        // _clearState();
        // _clearCodeVerifier();

        return {
          code: code,
          codeVerifier: codeVerifier, // Это пойдет в body.code_verifier
        };
      }
      throw new Error('State mismatch (возможная CSRF атака)');
    }
    return null;
  } catch (err) {
    console.error("Ошибка в oauthCodeHandler:", err.message);
    return null;
  }
}

// --- Вспомогательные функции (Internal) ---

async function _generateCodeVerifier() {
  const length = 64; // Оптимальная длина
  const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let codeVerifier = '';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    codeVerifier += allowedChars[array[i] % allowedChars.length];
  }
  sessionStorage.setItem('codeVerifier', codeVerifier);
  return codeVerifier;
}

async function _generateCodeChallenge() {
  const codeVerifier = _getCodeVerifier();
  if (!codeVerifier) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function _generateState() {
  const state = Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('oauth_state', state);
  return state;
}

function _getCodeVerifier() { return sessionStorage.getItem('codeVerifier'); }
function _clearCodeVerifier() { sessionStorage.removeItem('codeVerifier'); }
function _getState() { return sessionStorage.getItem('oauth_state'); }
function _clearState() { sessionStorage.removeItem('oauth_state'); }