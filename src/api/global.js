// src/api/global.js

export const getApiConfig = () => {
  return {
    // Берем базовый URL из .env или используем пустую строку
    baseURL: import.meta.env.VITE_API_URL || '', 
    headers: {
      'Content-Type': 'application/json',
      // Если нужны дополнительные заголовки, добавь их сюда
    }
  };
};