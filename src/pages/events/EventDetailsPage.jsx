// src/pages/events/EventDetailsPage.jsx (АДМИНСКАЯ ВЕРСИЯ)
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useEventStore from '../../stores/eventStore';
import './eventDetails.css';

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // Состояния
  const [isEditing, setIsEditing] = useState(false);
  const [registrationType, setRegistrationType] = useState('participant');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const { selectedEvent, loading, error, fetchEventById, updateEvent, deleteEvent } = useEventStore();
  const event = selectedEvent;

  // Форма редактирования
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: '',
    status: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    participantPoints: 0,
    fanPoints: 0,
    maxParticipants: 0,
    location: '',
    organizerId: null
  });

  useEffect(() => {
    if (eventId) {
      fetchEventById(parseInt(eventId));
    }
  }, [eventId, fetchEventById]);

  // Заполняем форму при загрузке события
  useEffect(() => {
    if (event && !isEditing) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || '',
        status: event.status || '',
        startDate: event.startDate ? event.startDate.slice(0, 16) : '',
        endDate: event.endDate ? event.endDate.slice(0, 16) : '',
        registrationDeadline: event.registrationDeadline ? event.registrationDeadline.slice(0, 16) : '',
        participantPoints: event.participantPoints || 0,
        fanPoints: event.fanPoints || 0,
        maxParticipants: event.maxParticipants || 0,
        location: event.location || '',
        organizerId: event.organizerId || null
      });
    }
  }, [event, isEditing]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    const result = await updateEvent(parseInt(eventId), formData);
    if (result) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
      const result = await deleteEvent(parseInt(eventId));
      if (result) {
        navigate('/events');
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Восстанавливаем данные из события
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: event.eventType || '',
        status: event.status || '',
        startDate: event.startDate ? event.startDate.slice(0, 16) : '',
        endDate: event.endDate ? event.endDate.slice(0, 16) : '',
        registrationDeadline: event.registrationDeadline ? event.registrationDeadline.slice(0, 16) : '',
        participantPoints: event.participantPoints || 0,
        fanPoints: event.fanPoints || 0,
        maxParticipants: event.maxParticipants || 0,
        location: event.location || '',
        organizerId: event.organizerId || null
      });
    }
  };

  // Форматирование даты для отображения
  const formatDate = (dateString) => {
    if (!dateString) return 'Дата не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventType = (type) => {
    const types = {
      'sport': 'Спортивное',
      'educational': 'Образовательное',
      'cultural': 'Культурное',
      'social': 'Социальное',
      'science': 'Научное',
      'other': 'Другое'
    };
    return types[type] || type || 'Не указан';
  };

  const formatStatus = (status) => {
    const statuses = {
      'active': 'Активно',
      'completed': 'Завершено',
      'cancelled': 'Отменено',
      'draft': 'Черновик'
    };
    return statuses[status] || status || 'Не указан';
  };

  const handleRegister = () => {
    setRegistrationSuccess(true);
    setIsRegistered(true);
    setTimeout(() => setRegistrationSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="event-detail loading">
        <div className="loader">Загрузка мероприятия...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-detail not-found">
        <h1>Мероприятие не найдено</h1>
        <p>{error || "Запрошенное мероприятие не существует или было удалено."}</p>
        <button onClick={() => navigate('/events')} className="back-btn">
          Вернуться к мероприятиям
        </button>
      </div>
    );
  }

  return (
    <div className="event-detail">
      {/* Кнопки навигации */}
      <div className="detail-nav-buttons">
        <button onClick={() => navigate('/events')} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Назад к мероприятиям
        </button>
        
        <div className="admin-actions">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                ✏️ Редактировать
              </button>
              <button onClick={handleDelete} className="delete-btn">
                🗑️ Удалить
              </button>
            </>
          ) : (
            <>
              <button onClick={handleSave} className="save-btn">
                💾 Сохранить
              </button>
              <button onClick={handleCancel} className="cancel-btn">
                ❌ Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="success-message-global">
          ✅ Изменения успешно сохранены!
        </div>
      )}

      <div className="event-detail-container">
        <div className="event-detail-header">
          {!isEditing ? (
            <h1 className="event-detail-title">{event.title}</h1>
          ) : (
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="edit-input edit-title"
              placeholder="Название мероприятия"
            />
          )}
          <div className={`event-status-badge ${event.status}`}>
            {formatStatus(event.status)}
          </div>
        </div>

        <div className="event-detail-content">
          {/* Левая колонка */}
          <div className="event-info">
            {/* Дата и место */}
            <div className="event-date-location">
              <div className="date-time">
                <svg className="icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 6v2h14V6H5z"/>
                </svg>
                <div>
                  {!isEditing ? (
                    <>
                      <div className="date">{formatDate(event.startDate)}</div>
                      <div className="time">
                        {formatTime(event.startDate)} 
                        {event.endDate && ` — ${formatTime(event.endDate)}`}
                      </div>
                    </>
                  ) : (
                    <div className="edit-date-group">
                      <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="edit-input"
                      />
                      <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="edit-input"
                        placeholder="Дата окончания"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="location">
                <svg className="icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div>
                  {!isEditing ? (
                    <div className="address">{event.location}</div>
                  ) : (
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="edit-input"
                      placeholder="Место проведения"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Описание */}
            <div className="event-full-description">
              <h3>Описание мероприятия</h3>
              {!isEditing ? (
                <p>{event.description || "Описание отсутствует"}</p>
              ) : (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="edit-textarea"
                  rows="5"
                  placeholder="Описание мероприятия"
                />
              )}
            </div>

            {/* Детали мероприятия */}
            <div className="event-details">
              <h3>Детали мероприятия</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Тип события:</span>
                  {!isEditing ? (
                    <span className="detail-value">{formatEventType(event.eventType)}</span>
                  ) : (
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      className="edit-select"
                    >
                      <option value="">Выберите тип</option>
                      <option value="sport">Спортивное</option>
                      <option value="educational">Образовательное</option>
                      <option value="cultural">Культурное</option>
                      <option value="social">Социальное</option>
                      <option value="science">Научное</option>
                      <option value="other">Другое</option>
                    </select>
                  )}
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Статус:</span>
                  {!isEditing ? (
                    <span className="detail-value">{formatStatus(event.status)}</span>
                  ) : (
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="edit-select"
                    >
                      <option value="active">Активно</option>
                      <option value="completed">Завершено</option>
                      <option value="cancelled">Отменено</option>
                      <option value="draft">Черновик</option>
                    </select>
                  )}
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Баллы участнику:</span>
                  {!isEditing ? (
                    <span className="detail-value">{event.participantPoints || 0} баллов</span>
                  ) : (
                    <input
                      type="number"
                      name="participantPoints"
                      value={formData.participantPoints}
                      onChange={handleInputChange}
                      className="edit-input-small"
                      min="0"
                    />
                  )}
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Баллы болельщику:</span>
                  {!isEditing ? (
                    <span className="detail-value">{event.fanPoints || 0} баллов</span>
                  ) : (
                    <input
                      type="number"
                      name="fanPoints"
                      value={formData.fanPoints}
                      onChange={handleInputChange}
                      className="edit-input-small"
                      min="0"
                    />
                  )}
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Макс. участников:</span>
                  {!isEditing ? (
                    <span className="detail-value">{event.maxParticipants || 'Не ограничено'}</span>
                  ) : (
                    <input
                      type="number"
                      name="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      className="edit-input-small"
                      min="0"
                    />
                  )}
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Дедлайн регистрации:</span>
                  {!isEditing ? (
                    <span className="detail-value">
                      {event.registrationDeadline ? formatDate(event.registrationDeadline) : 'Не указан'}
                    </span>
                  ) : (
                    <input
                      type="datetime-local"
                      name="registrationDeadline"
                      value={formData.registrationDeadline}
                      onChange={handleInputChange}
                      className="edit-input"
                    />
                  )}
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">ID мероприятия:</span>
                  <span className="detail-value">#{event.id}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">ID организатора:</span>
                  {!isEditing ? (
                    <span className="detail-value">{event.organizerId || 'Не указан'}</span>
                  ) : (
                    <input
                      type="number"
                      name="organizerId"
                      value={formData.organizerId || ''}
                      onChange={handleInputChange}
                      className="edit-input-small"
                      placeholder="ID организатора"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Даты создания и обновления */}
            <div className="event-meta">
              <h3>Информация о публикации</h3>
              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Создано:</span>
                  <span className="meta-value">{formatDate(event.createdAt)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Обновлено:</span>
                  <span className="meta-value">{formatDate(event.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - регистрация */}
          <div className="event-registration">
            <div className="registration-card">
              <h3>Регистрация</h3>
              
              {isRegistered ? (
                <div className="registration-success">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#28a745">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <h4>Вы успешно зарегистрированы!</h4>
                  <p>Мы отправили подтверждение на вашу почту.</p>
                </div>
              ) : (
                <>
                  <div className="registration-type">
                    <div className="type-options">
                      <button
                        className={`type-btn ${registrationType === 'participant' ? 'active' : ''}`}
                        onClick={() => setRegistrationType('participant')}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span>Участник</span>
                      </button>
                      
                      <button
                        className={`type-btn ${registrationType === 'spectator' ? 'active' : ''}`}
                        onClick={() => setRegistrationType('spectator')}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 13v7H4V6h5.02c.05-.71.22-1.38.48-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5l-2-2zM16 21H6v-1h10v1zm3.5-8.5L21 13l-7 7-4.5-4.5L10 14l3 3 5.5-5.5z"/>
                        </svg>
                        <span>Болельщик</span>
                      </button>
                    </div>
                    
                    <div className="type-info">
                      {registrationType === 'participant' ? (
                        <>
                          <h4>Участие в мероприятии</h4>
                          <ul>
                            <li>Активное участие в мероприятии</li>
                            <li>Получение {event.participantPoints || 0} баллов</li>
                            <li>Командное взаимодействие</li>
                            <li>Следуйте правилам мероприятия</li>
                          </ul>
                        </>
                      ) : (
                        <>
                          <h4>Наблюдение за мероприятием</h4>
                          <ul>
                            <li>Посещение в качестве зрителя</li>
                            <li>Поддержка участников</li>
                            <li>Получение {event.fanPoints || 0} баллов</li>
                            <li>Бесплатное посещение</li>
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                    
                  <button
                    className="register-btn"
                    onClick={handleRegister}
                    disabled={event.status !== 'active'}
                  >
                    {event.status !== 'active' 
                      ? 'Регистрация закрыта'
                      : registrationType === 'participant' 
                        ? 'Записаться как участник'
                        : 'Записаться как болельщик'}
                  </button>

                  {registrationSuccess && (
                    <div className="success-message">
                      Регистрация прошла успешно!
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;