import React from 'react';
import useAuthStore from '../auth/authStore'; // Проверь путь до своего стора

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  // Пока идет проверка (например, из localStorage), показываем спиннер
  if (loading) {
    return (
      <div className="loading-container">
        <p>Загрузка...</p>
      </div>
    );
  }

  // Если НЕ авторизован — показываем заглушку
  if (!isAuthenticated) {
    return (
      <div className="accountGuestMessage">
        <p>Пожалуйста, авторизуйтесь для доступа к контенту.</p>
      </div>
    );
  }

  // Если авторизован — показываем контент страницы
  return children;
};

export default ProtectedRoute;