// stores/eventStore.js - ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ

import { create } from 'zustand';

const API_BASE_URL = 'https://songeng.voold.online/api';

const useEventStore = create((set, get) => ({
  events: [],
  loading: false,
  error: null,
  selectedEvent: null,
  totalPages: 0,
  currentPage: 1,
  eventParticipants: [],
  participantsLoading: false,

  fetchEvents: async (page = 1, limit = 100) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      
      const data = await response.json();
      const events = Array.isArray(data) ? data : (data.events || data.data || []);
      
      set({ events, loading: false });
      return data;
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  fetchEventById: async (uuid) => {
    set({ loading: true, error: null });
    
    if (!uuid || uuid === 'undefined' || uuid === 'NaN') {
      set({ error: 'Невалидный идентификатор мероприятия', loading: false });
      return null;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${uuid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) throw new Error('Мероприятие не найдено');
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      const data = await response.json();
      const event = data.event || data.data || data;
      set({ selectedEvent: event, loading: false });
      return event;
    } catch (error) {
      console.error('Ошибка загрузки мероприятия:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  createEvent: async (eventData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      
      const result = await response.json();
      set({ loading: false });
      return result;
    } catch (error) {
      console.error('Ошибка создания мероприятия:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  updateEvent: async (uuid, eventData) => {
    set({ loading: true, error: null });
    
    if (!uuid || uuid === 'undefined' || uuid === 'NaN') {
      console.error('❌ updateEvent: невалидный UUID:', uuid);
      set({ error: 'Невалидный идентификатор мероприятия', loading: false });
      return null;
    }
    
    try {
      const eventId = String(uuid).trim();
      
      const attempts = [
        { method: 'PATCH', url: `${API_BASE_URL}/events/${eventId}` },
        { method: 'PUT', url: `${API_BASE_URL}/events/${eventId}` },
        { method: 'POST', url: `${API_BASE_URL}/events/update/${eventId}` },
        { method: 'POST', url: `${API_BASE_URL}/events/edit/${eventId}` },
        { method: 'POST', url: `${API_BASE_URL}/events/${eventId}`, body: { ...eventData, _method: 'PUT' } },
        { method: 'POST', url: `${API_BASE_URL}/events/${eventId}`, body: { ...eventData, _method: 'PATCH' } }
      ];
      
      let lastError = null;
      
      for (const attempt of attempts) {
        try {
          const bodyToSend = attempt.body || eventData;
          
          console.log(`📡 Пробуем ${attempt.method} ${attempt.url}`);
          
          const response = await fetch(attempt.url, {
            method: attempt.method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyToSend),
          });
          
          console.log(`📥 Статус ${attempt.method} ${attempt.url}:`, response.status);
          
          if (response.ok) {
            const responseText = await response.text();
            let result;
            try {
              result = JSON.parse(responseText);
            } catch (e) {
              result = { message: responseText };
            }
            
            const updatedEvent = result.event || result;
            
            console.log(`✅ Обновлено через:`, attempt.method, attempt.url);
            
            set((state) => ({
              events: state.events.map(event => 
                (event.uuid === eventId || event.id === eventId) ? updatedEvent : event
              ),
              selectedEvent: updatedEvent,
              loading: false
            }));
            
            return { success: true, event: updatedEvent };
          } else {
            const errorText = await response.text();
            console.log(`❌ Ошибка ${attempt.method} ${attempt.url}:`, response.status, errorText);
            lastError = new Error(`Ошибка: ${response.status}`);
          }
        } catch (err) {
          console.log(`❌ Исключение ${attempt.method} ${attempt.url}:`, err.message);
          lastError = err;
        }
      }
      
      throw lastError || new Error('Не удалось обновить мероприятие');
      
    } catch (error) {
      console.error('❌ Ошибка обновления мероприятия:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  deleteEvent: async (uuid) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${uuid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      
      set((state) => ({
        events: state.events.filter(e => e.uuid !== uuid),
        selectedEvent: state.selectedEvent?.uuid === uuid ? null : state.selectedEvent,
        loading: false
      }));
      
      return true;
    } catch (error) {
      console.error('Ошибка удаления мероприятия:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  fetchEventParticipants: async (uuid) => {
    if (!uuid) return { success: false, persons: [] };
    
    set({ participantsLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${uuid}/persons`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (response.status === 401) {
        set({ participantsLoading: false, eventParticipants: [] });
        return { success: false, persons: [], count: 0, error: 'Unauthorized' };
      }
      
      if (response.status === 400) {
        const errorData = await response.json();
        console.warn('⚠️ Bad Request:', errorData);
        set({ participantsLoading: false, eventParticipants: [] });
        return { success: false, persons: [], count: 0, error: errorData.message };
      }
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      const data = await response.json();
      
      let persons = [];
      if (data.success && data.persons) {
        persons = data.persons;
      } else if (Array.isArray(data)) {
        persons = data;
      } else if (data.data && Array.isArray(data.data)) {
        persons = data.data;
      } else if (data.persons) {
        persons = data.persons;
      }
      
      console.log(`✅ Загружены участники для ${uuid}:`, { count: persons.length });
      
      set({ eventParticipants: persons, participantsLoading: false });
      return { success: true, persons, count: persons.length };
      
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      set({ participantsLoading: false, eventParticipants: [] });
      return { success: false, persons: [], count: 0, error: error.message };
    }
  },
  
  awardPointsToParticipants: async (uuid, userIds) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${uuid}/persons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds }),
      });
      
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      
      const result = await response.json();
      set({ loading: false });
      return result;
    } catch (error) {
      console.error('Ошибка начисления баллов:', error);
      set({ error: error.message, loading: false });
      return { success: false, message: error.message };
    }
  },
  
  registerForEvent: async (uuid, registrationType) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${uuid}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ registrationType }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Ошибка: ${response.status}`);
      }
      
      const result = await response.json();
      set({ loading: false });
      return result;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  unregisterFromEvent: async (uuid) => {
    set({ loading: true, error: null });
    
    try {
      const cleanUuid = String(uuid).trim();
      const url = `${API_BASE_URL}/events/${cleanUuid}/unregister`;
      
      console.log('📡 DELETE запрос на отмену регистрации:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      console.log('📥 Статус ответа:', response.status);
      
      if (response.status === 404) {
        console.warn('⚠️ Пользователь не был зарегистрирован на это мероприятие');
        set({ loading: false });
        return { success: true, message: 'Пользователь не был зарегистрирован' };
      }
      
      if (!response.ok) {
        let errorMessage = `Ошибка: ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ Отмена регистрации успешна:', result);
      set({ loading: false });
      return { success: true, ...result };
      
    } catch (error) {
      console.error('Ошибка отмены регистрации:', error);
      set({ error: error.message, loading: false });
      return { success: false, message: error.message };
    }
  },
  
  clearError: () => set({ error: null }),
  clearSelectedEvent: () => set({ selectedEvent: null }),
  clearParticipants: () => set({ eventParticipants: [] }),
}));

export default useEventStore;