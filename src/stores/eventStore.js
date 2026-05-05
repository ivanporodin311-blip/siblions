// stores/eventStore.js (ФИНАЛЬНАЯ ВЕРСИЯ)
import { create } from 'zustand';

const API_BASE_URL = 'https://songeng.voold.online/api';

const useEventStore = create((set, get) => ({
  events: [],
  loading: false,
  error: null,
  selectedEvent: null,
  totalPages: 0,
  currentPage: 1,

  fetchEvents: async (page = 1, limit = 100) => {
    set({ loading: true, error: null });
    
    try {
      const url = `${API_BASE_URL}/events?page=${page}&limit=${limit}`;
      console.log('📡 GET запрос:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Не авторизован. Пожалуйста, войдите в систему.');
        }
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.events && Array.isArray(data.events)) {
        set({ events: data.events, totalPages: data.totalPages || 0, currentPage: page, loading: false });
      } else if (Array.isArray(data)) {
        set({ events: data, loading: false });
      } else {
        set({ events: data.data || data.items || [], loading: false });
      }
      return data;
      
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  fetchEventById: async (uuid) => {
    set({ loading: true, error: null });
    
    if (!uuid || uuid === 'undefined' || uuid === 'NaN' || uuid === 'null') {
      console.error('❌ fetchEventById: невалидный UUID:', uuid);
      set({ error: 'Невалидный идентификатор мероприятия', loading: false });
      return null;
    }
    
    try {
      const url = `${API_BASE_URL}/events/${uuid}`;
      console.log('📡 GET запрос (UUID):', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Не авторизован. Пожалуйста, войдите в систему.');
        }
        if (response.status === 404) {
          throw new Error('Мероприятие не найдено');
        }
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
      console.log('📡 POST запрос на создание события');
      console.log('📦 Данные:', JSON.stringify(eventData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });
      
      // Получаем текст ответа для отладки
      const responseText = await response.text();
      console.log('📥 Статус ответа:', response.status);
      console.log('📥 Тело ответа:', responseText);
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} - ${responseText}`);
      }
      
      const newEvent = JSON.parse(responseText);
      console.log('✅ Событие создано:', newEvent);
      
      set((state) => ({ 
        events: [newEvent, ...state.events],
        loading: false 
      }));
      
      return newEvent;
      
    } catch (error) {
      console.error('❌ Ошибка создания мероприятия:', error);
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
      const eventId = typeof uuid === 'string' ? uuid : String(uuid);
      
      const endpoints = [
        `${API_BASE_URL}/events/${eventId}`,
        `${API_BASE_URL}/events/update/${eventId}`,
        `${API_BASE_URL}/events/edit/${eventId}`,
        `${API_BASE_URL}/events/${eventId}/update`
      ];
      
      let lastError = null;
      
      for (const url of endpoints) {
        console.log(`📡 Пробуем POST запрос (UUID):`, url);
        
        try {
          let response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(eventData),
          });
          
          if (!response.ok && response.status === 404) {
            console.log(`🔄 POST не сработал, пробуем PUT...`);
            response = await fetch(url, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(eventData),
            });
          }
          
          console.log(`📥 Статус ответа для ${url}:`, response.status);
          
          if (response.ok) {
            const responseText = await response.text();
            let updatedEvent;
            try {
              updatedEvent = JSON.parse(responseText);
            } catch (e) {
              updatedEvent = { ...eventData, uuid: eventId };
            }
            
            console.log('✅ Обновлено событие через:', url);
            
            set((state) => ({
              events: state.events.map(event => 
                (event.uuid === eventId || event.id === eventId) ? updatedEvent : event
              ),
              selectedEvent: updatedEvent,
              loading: false
            }));
            
            return updatedEvent;
          } else {
            const errorText = await response.text();
            console.log(`❌ Ошибка на ${url}:`, response.status, errorText);
            lastError = new Error(`Ошибка: ${response.status}`);
          }
        } catch (err) {
          console.log(`❌ Исключение на ${url}:`, err.message);
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
    
    if (!uuid || uuid === 'undefined' || uuid === 'NaN') {
      console.error('❌ deleteEvent: невалидный UUID:', uuid);
      set({ error: 'Невалидный идентификатор мероприятия', loading: false });
      return false;
    }
    
    try {
      const eventId = typeof uuid === 'string' ? uuid : String(uuid);
      
      let response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log('📥 DELETE статус:', response.status);
      
      if (!response.ok) {
        console.log('🔄 Пробуем POST с _method=DELETE');
        const postResponse = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ _method: 'DELETE' }),
        });
        
        if (!postResponse.ok) {
          throw new Error(`Ошибка: ${postResponse.status}`);
        }
      }
      
      set((state) => ({
        events: state.events.filter(event => 
          (event.uuid !== eventId && event.id !== eventId)
        ),
        selectedEvent: (state.selectedEvent?.uuid === eventId || state.selectedEvent?.id === eventId) 
          ? null 
          : state.selectedEvent,
        loading: false
      }));
      
      return true;
      
    } catch (error) {
      console.error('Ошибка удаления мероприятия:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  registerForEvent: async (uuid, registrationData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${uuid}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registrationData),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Не авторизован. Пожалуйста, войдите в систему.');
        }
        throw new Error(`Ошибка регистрации: ${response.status}`);
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
  
  unregisterFromEvent: async (uuid, userId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${uuid}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка отмены регистрации: ${response.status}`);
      }
      
      const result = await response.json();
      set({ loading: false });
      return result;
      
    } catch (error) {
      console.error('Ошибка отмены регистрации:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  clearError: () => set({ error: null }),
  clearSelectedEvent: () => set({ selectedEvent: null }),
}));

export const useEvents = () => useEventStore((state) => state.events);
export const useEventLoading = () => useEventStore((state) => state.loading);
export const useEventError = () => useEventStore((state) => state.error);
export const useSelectedEvent = () => useEventStore((state) => state.selectedEvent);
export const useTotalPages = () => useEventStore((state) => state.totalPages);
export const useCurrentPage = () => useEventStore((state) => state.currentPage);

export default useEventStore;