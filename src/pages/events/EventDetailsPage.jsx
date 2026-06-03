// src/pages/events/EventDetailsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from "xlsx";
import useEventStore from '../../stores/eventStore';
import EventParticipantsTable from "./EventCard/EventParticipantsTable";
import './eventDetails.css';

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // Состояния для редактирования и регистрации
  const [isEditing, setIsEditing] = useState(false);
  const [registrationType, setRegistrationType] = useState('participant');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Состояния для участников
  const [participants, setParticipants] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const { 
    selectedEvent, 
    loading, 
    error, 
    fetchEventById, 
    updateEvent, 
    deleteEvent,
    fetchEventParticipants,
    awardPointsToParticipants
  } = useEventStore();
  
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

  // Загружаем мероприятие
  useEffect(() => {
    if (eventId && eventId !== 'undefined' && eventId !== 'NaN') {
      console.log('📡 Загружаем мероприятие с UUID:', eventId);
      fetchEventById(eventId);
    }
  }, [eventId, fetchEventById]);

  // Загружаем участников мероприятия
  useEffect(() => {
    const loadParticipants = async () => {
      if (!eventId || eventId === 'undefined') return;
      
      setLoadingParticipants(true);
      try {
        const response = await fetchEventParticipants(eventId);
        if (response?.success && response.persons) {
          const formattedParticipants = response.persons.map(person => ({
            id: person.id,
            name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.username,
            username: person.username,
            email: person.email,
            group: person.group || "",
            school: person.school || "",
            points: 0,
            totalPoints: person.totalPoints || 0,
            registrationId: person.registrationId,
            role: person.role,
            attended: person.attended || false
          }));
          setParticipants(formattedParticipants);
        } else {
          setParticipants([]);
        }
      } catch (error) {
        console.error("Ошибка загрузки участников:", error);
        showToastMessage("Ошибка загрузки участников");
      } finally {
        setLoadingParticipants(false);
      }
    };

    loadParticipants();
  }, [eventId, fetchEventParticipants]);

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

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    if (!eventId) return;
    const result = await updateEvent(eventId, formData);
    if (result) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    if (window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
      const result = await deleteEvent(eventId);
      if (result) {
        navigate('/events');
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
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

  // Редактирование участника
  const handleEditParticipant = async (participantId, editData) => {
    console.log('Редактирование участника:', participantId, editData);
    showToastMessage('Редактирование участников пока недоступно через API');
  };

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
      'draft': 'Черновик',
      'published': 'Опубликовано'
    };
    return statuses[status] || status || 'Не указан';
  };

  const participantTotals = useMemo(() => {
    const totals = {};
    participants.forEach((p) => {
      totals[p.id] = p.totalPoints || 0;
    });
    return totals;
  }, [participants]);

  const handleExportExcel = () => {
    const rows = participants.map((p, i) => ({
      "№": i + 1,
      "ФИО": p.name,
      "Username": p.username,
      "Email": p.email,
      "Группа": p.group,
      "Школа": p.school,
      "Баллы за мероприятие": p.points || 0,
      "Общие баллы": participantTotals[p.id] ?? 0,
      "Роль": p.role === "participant" ? "Участник" : "Болельщик",
      "Отметка о посещении": p.attended ? "✓" : "—"
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Участники");

    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key]).length)) + 2,
    }));
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `Участники — ${event?.title || 'Мероприятие'}.xlsx`);
  };

  const handlePointsChange = (participantId, points) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, points: parseInt(points) || 0 } : p
      )
    );
  };

  const handleSaveResults = async () => {
    if (!eventId) {
      showToastMessage("ID мероприятия не найден");
      return;
    }

    const participantsWithPoints = participants.filter(p => p.points > 0);
    
    if (participantsWithPoints.length === 0) {
      showToastMessage("Нет участников для начисления баллов");
      return;
    }

    setLoadingParticipants(true);
    try {
      const userIds = participantsWithPoints.map(p => p.id);
      const result = await awardPointsToParticipants(eventId, userIds);
      
      if (result?.success) {
        setParticipants(prev =>
          prev.map(p => {
            const awarded = result.results?.find(r => r.userId === p.id);
            if (awarded) {
              return { ...p, totalPoints: (p.totalPoints || 0) + p.points, points: 0 };
            }
            return p;
          })
        );
        showToastMessage(`Баллы успешно начислены! ${result.results?.length || userIds.length} участников получили баллы`);
      } else {
        throw new Error(result?.message || "Ошибка при начислении баллов");
      }
    } catch (error) {
      console.error("Ошибка сохранения результатов:", error);
      showToastMessage(error.message || "Ошибка при сохранении результатов");
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(`https://songeng.voold.online/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ registrationType })
      });

      if (!response.ok) {
        throw new Error("Ошибка регистрации");
      }

      setRegistrationSuccess(true);
      setIsRegistered(true);
      setTimeout(() => setRegistrationSuccess(false), 3000);
      
      // Обновляем список участников
      const updatedParticipants = await fetchEventParticipants(eventId);
      if (updatedParticipants?.success && updatedParticipants.persons) {
        const formatted = updatedParticipants.persons.map(person => ({
          id: person.id,
          name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.username,
          username: person.username,
          email: person.email,
          group: person.group || "",
          school: person.school || "",
          points: 0,
          totalPoints: person.totalPoints || 0,
          registrationId: person.registrationId,
          role: person.role,
          attended: person.attended || false
        }));
        setParticipants(formatted);
      }
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      showToastMessage("Ошибка при регистрации");
    }
  };

  if (!eventId || eventId === 'undefined' || eventId === 'NaN') {
    return (
      <div className="event-detail not-found">
        <h1>Ошибка</h1>
        <p>Неверный идентификатор мероприятия</p>
        <button onClick={() => navigate('/events')} className="back-btn">
          Вернуться к мероприятиям
        </button>
      </div>
    );
  }

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
      {showToast && (
        <div className="event-toast">{toastMessage}</div>
      )}

      <div className="detail-nav-buttons">
        <button onClick={() => navigate('/events')} className="back-btn">
          ← Назад к мероприятиям
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
        <div className="success-message-global">✅ Изменения успешно сохранены!</div>
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
            />
          )}
          <div className={`event-status-badge ${event.status}`}>
            {formatStatus(event.status)}
          </div>
        </div>

        <div className="event-detail-content">
          <div className="event-info">
            <div className="event-date-location">
              <div className="date-time">
                📅
                <div>
                  <div className="date">{formatDate(event.startDate)}</div>
                  <div className="time">{formatTime(event.startDate)}</div>
                </div>
              </div>
              <div className="location">
                📍
                <div>{event.location || "Место не указано"}</div>
              </div>
            </div>

            <div className="event-full-description">
              <h3>Описание</h3>
              <p>{event.description || "Описание отсутствует"}</p>
            </div>

            <div className="event-details">
              <h3>Детали мероприятия</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Тип события:</span>
                  <span className="detail-value">{formatEventType(event.eventType)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Статус:</span>
                  <span className="detail-value">{formatStatus(event.status)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Баллы участнику:</span>
                  <span className="detail-value">{event.participantPoints || 0} баллов</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Баллы болельщику:</span>
                  <span className="detail-value">{event.fanPoints || 0} баллов</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Макс. участников:</span>
                  <span className="detail-value">{event.maxParticipants || 'Не ограничено'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Дедлайн регистрации:</span>
                  <span className="detail-value">
                    {event.registrationDeadline ? formatDate(event.registrationDeadline) : 'Не указан'}
                  </span>
                </div>
              </div>
            </div>

            <div className="event-participants-section">
              <div className="participants-header">
                <h3>Участники мероприятия</h3>
                <div className="participants-actions">
                  <button className="export-btn" onClick={handleExportExcel} disabled={participants.length === 0}>
                    📊 Excel
                  </button>
                  <button className="save-results-btn" onClick={handleSaveResults} disabled={loadingParticipants}>
                    💾 Сохранить результаты
                  </button>
                </div>
              </div>

              <EventParticipantsTable
                participants={participants}
                onPointsChange={handlePointsChange}
                participantTotals={participantTotals}
                onEditParticipant={handleEditParticipant}
              />
            </div>
          </div>

          {/* Правая колонка - регистрация */}
          <div className="event-registration">
            <div className="registration-card">
              <h3>Регистрация</h3>
              {isRegistered ? (
                <div className="registration-success">
                  <h4>✅ Вы успешно зарегистрированы!</h4>
                </div>
              ) : (
                <>
                  <div className="registration-type">
                    <div className="type-options">
                      <button
                        className={`type-btn ${registrationType === 'participant' ? 'active' : ''}`}
                        onClick={() => setRegistrationType('participant')}
                      >
                        👤 Участник
                      </button>
                      <button
                        className={`type-btn ${registrationType === 'fan' ? 'active' : ''}`}
                        onClick={() => setRegistrationType('fan')}
                      >
                        👥 Болельщик
                      </button>
                    </div>
                    <div className="type-info">
                      {registrationType === 'participant' ? (
                        <>
                          <h4>Участие в мероприятии</h4>
                          <ul>
                            <li>Активное участие в мероприятии</li>
                            <li>Получение {event.participantPoints || 0} баллов</li>
                          </ul>
                        </>
                      ) : (
                        <>
                          <h4>Наблюдение за мероприятием</h4>
                          <ul>
                            <li>Посещение в качестве зрителя</li>
                            <li>Получение {event.fanPoints || 0} баллов</li>
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                  <button className="register-btn" onClick={handleRegister}>
                    Записаться как {registrationType === 'participant' ? 'участник' : 'болельщик'}
                  </button>
                  {registrationSuccess && <div className="success-message">✅ Регистрация успешна!</div>}
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