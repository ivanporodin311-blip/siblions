// src/pages/events/EventDetailsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from "xlsx";
import useEventStore from '../../stores/eventStore';
import EventParticipantsTable from "./EventCard/EventParticipantsTable";
import CustomSelect from "./modalAddWindow/CustomSelect";
import './eventDetails.css';

// Опции для выпадающего списка типа события (русские названия)
const EVENT_TYPE_OPTIONS = [
  'Спортивное',
  'Образовательное',
  'Культурное',
  'Социальное',
  'Научное',
  'Другое'
];

// Маппинг: ключ API → русское название
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

// Обратный маппинг: русское название → ключ API
const eventTypeToKey = (label) => {
  const reverse = {
    'Спортивное': 'sport',
    'Образовательное': 'educational',
    'Культурное': 'cultural',
    'Социальное': 'social',
    'Научное': 'science',
    'Другое': 'other'
  };
  return reverse[label] || label || '';
};

// Компонент слайдера статусов
const STATUS_LIST = [
  { value: 'draft', label: 'Черновик', color: '#94a3b8' },
  { value: 'published', label: 'Опубликовано', color: '#3b82f6' },
  { value: 'active', label: 'Активно', color: '#10b981' },
  { value: 'completed', label: 'Завершено', color: '#6b7280' },
  { value: 'cancelled', label: 'Отменено', color: '#ef4444' },
];

const StatusSlider = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = React.useRef(null);

  const currentIndex = Math.max(
    0,
    STATUS_LIST.findIndex((s) => s.value === value)
  );
  const progress = STATUS_LIST.length > 1 ? (currentIndex / (STATUS_LIST.length - 1)) * 100 : 0;
  const activeColor = STATUS_LIST[currentIndex]?.color || '#003466';

  const getIndexFromPosition = (clientX) => {
    if (!trackRef.current) return currentIndex;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(percent * (STATUS_LIST.length - 1));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const idx = getIndexFromPosition(e.clientX);
    onChange(STATUS_LIST[idx].value);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const idx = getIndexFromPosition(e.clientX);
      onChange(STATUS_LIST[idx].value);
    };

    const handleTouchMove = (e) => {
      if (e.touches[0]) {
        const idx = getIndexFromPosition(e.touches[0].clientX);
        onChange(STATUS_LIST[idx].value);
      }
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, onChange]);

  return (
    <div className="status-slider">
      <div
        className="status-slider-track"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          if (e.touches[0]) {
            setIsDragging(true);
            const idx = getIndexFromPosition(e.touches[0].clientX);
            onChange(STATUS_LIST[idx].value);
          }
        }}
      >
        <div
          className="status-slider-fill"
          style={{ width: `${progress}%`, background: activeColor }}
        />
        <div
          className="status-slider-thumb"
          style={{
            left: `${progress}%`,
            background: activeColor,
            boxShadow: `0 2px 8px ${activeColor}66`,
          }}
        />
        {STATUS_LIST.map((status, idx) => {
          const pos = STATUS_LIST.length > 1 ? (idx / (STATUS_LIST.length - 1)) * 100 : 0;
          const isActive = idx === currentIndex;
          return (
            <div
              key={status.value}
              className={`status-slider-dot ${isActive ? 'active' : ''}`}
              style={{
                left: `${pos}%`,
                background: idx <= currentIndex ? activeColor : '#e2e8f0',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(status.value);
              }}
            />
          );
        })}
      </div>
      <div className="status-slider-labels">
        {STATUS_LIST.map((status, idx) => (
          <div
            key={status.value}
            className={`status-slider-label ${idx === currentIndex ? 'active' : ''}`}
            style={{ color: idx === currentIndex ? activeColor : '#64748b' }}
            onClick={() => onChange(status.value)}
          >
            {status.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [registrationType, setRegistrationType] = useState('participant');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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
    if (eventId && eventId !== 'undefined' && eventId !== 'NaN') {
      console.log('📡 Загружаем мероприятие с UUID:', eventId);
      fetchEventById(eventId);
    }
  }, [eventId, fetchEventById]);

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

  useEffect(() => {
    if (event && !isEditing) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        eventType: formatEventType(event.eventType), // ← русское название
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
    
    // Перед отправкой конвертируем русское название типа события обратно в ключ API
    const dataToSend = {
      ...formData,
      eventType: eventTypeToKey(formData.eventType)
    };
    
    const result = await updateEvent(eventId, dataToSend);
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
        eventType: formatEventType(event.eventType), // ← русское название
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

  const getStatusClass = (status) => {
    const now = new Date();
    const startDate = event?.startDate ? new Date(event.startDate) : null;
    const endDate = event?.endDate ? new Date(event.endDate) : null;
    
    if (status === 'cancelled') return 'past';
    if (status === 'completed') return 'past';
    if (startDate && startDate > now) return 'future';
    if (endDate && endDate < now) return 'past';
    return 'future';
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
      <div className="errorContainer">
        <h1 className="errorMessage">Ошибка</h1>
        <p className="errorMessage">Неверный идентификатор мероприятия</p>
        <button onClick={() => navigate('/events')} className="backToEventsButton">
          ← Вернуться к мероприятиям
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loadingContainer">
        <p>Загрузка мероприятия...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="errorContainer">
        <h1 className="errorMessage">Мероприятие не найдено</h1>
        <p className="errorMessage">{error || "Запрошенное мероприятие не существует или было удалено."}</p>
        <button onClick={() => navigate('/events')} className="backToEventsButton">
          ← Вернуться к мероприятиям
        </button>
      </div>
    );
  }

  return (
    <div className="eventDetailsPage">
      {showToast && (
        <div className="event-toast">{toastMessage}</div>
      )}

      <div className="eventDetailsHeader">
        <button onClick={() => navigate('/events')} className="backToEventsButton" style={{ marginTop: 0 }}>
          ← Назад к мероприятиям
        </button>
        <h1 className="event-detail-title">
          {event.title}
        </h1>
        <div className={`eventStatus ${getStatusClass(event.status)}`}>
          {formatStatus(event.status)}
        </div>
      </div>

      {saveSuccess && (
        <div className="success-message-global">✅ Изменения успешно сохранены!</div>
      )}

      <div className="eventDetailsContent">
        <div className="eventDetailsCard eventCard--details">
          
          <div className="eventDetailsSection">
            <h3>Основная информация</h3>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Название:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  event.title
                ) : (
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                )}
              </div>
            </div>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Дата и время:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  `${formatDate(event.startDate)} в ${formatTime(event.startDate)}`
                ) : (
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                )}
              </div>
            </div>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Место проведения:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  event.location || "Место не указано"
                ) : (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="eventDetailsSection">
            <h3>Описание</h3>
            {!isEditing ? (
              <div className="eventDetailsDescription">
                {event.description || "Описание отсутствует"}
              </div>
            ) : (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="edit-input edit-textarea"
                rows="5"
              />
            )}
          </div>

          <div className="eventDetailsSection">
            <h3>Детали мероприятия</h3>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Тип события:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  formatEventType(event.eventType)
                ) : (
                  <CustomSelect
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    options={EVENT_TYPE_OPTIONS}
                    placeholder="Выберите тип..."
                  />
                )}
              </div>
            </div>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Статус:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  formatStatus(event.status)
                ) : (
                  <StatusSlider
                    value={formData.status}
                    onChange={(status) => setFormData((prev) => ({ ...prev, status }))}
                  />
                )}
              </div>
            </div>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Баллы участнику:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  `${event.participantPoints || 0} баллов`
                ) : (
                  <input
                    type="number"
                    name="participantPoints"
                    value={formData.participantPoints}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                )}
              </div>
            </div>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Баллы болельщику:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  `${event.fanPoints || 0} баллов`
                ) : (
                  <input
                    type="number"
                    name="fanPoints"
                    value={formData.fanPoints}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                )}
              </div>
            </div>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Макс. участников:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  event.maxParticipants || 'Не ограничено'
                ) : (
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                )}
              </div>
            </div>
            <div className="eventDetailsRow">
              <div className="eventDetailsLabel">Дедлайн регистрации:</div>
              <div className="eventDetailsValue">
                {!isEditing ? (
                  event.registrationDeadline ? formatDate(event.registrationDeadline) : 'Не указан'
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
            </div>
          </div>

          <div className="eventDetailsSection">
            <h3>Участники мероприятия</h3>
            <div className="participants-actions">
              <button className="export-btn" onClick={handleExportExcel} disabled={participants.length === 0}>
                 Excel
              </button>
              <button className="save-results-btn" onClick={handleSaveResults} disabled={loadingParticipants}>
                Сохранить результаты
              </button>
            </div>
            <EventParticipantsTable
              participants={participants}
              onPointsChange={handlePointsChange}
              participantTotals={participantTotals}
              onEditParticipant={handleEditParticipant}
            />
          </div>

          <div className="eventDetailsActions">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="editEventButton">
                  Редактировать
                </button>
                <button onClick={handleDelete} className="deleteEventButton">
                  Удалить
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} className="editEventButton">
                  Сохранить
                </button>
                <button onClick={handleCancel} className="deleteEventButton">
                  Отмена
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;