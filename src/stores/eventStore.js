// stores/eventStore.js (исправленный - использует POST для обновления)
import { create } from 'zustand';

const API_BASE_URL = 'https://songeng.voold.online/api';

const useEventStore = create((set, get) => ({
  // Состояние
  events: [],
  loading: false,
  error: null,
  selectedEvent: null,
  
  totalPages: 0,
  currentPage: 1,

  // Получение всех мероприятий
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
      });
      
      if (!response.ok) {
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
  
  // Получение одного мероприятия по ID
  fetchEventById: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const url = `${API_BASE_URL}/events/${id}`;
      console.log('📡 GET запрос:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
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
  
  // Создание нового мероприятия
  createEvent: async (eventData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      const newEvent = await response.json();
      
      set((state) => ({ 
        events: [newEvent, ...state.events],
        loading: false 
      }));
      
      return newEvent;
      
    } catch (error) {
      console.error('Ошибка создания мероприятия:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  // Обновление мероприятия - используем POST вместо PUT
  updateEvent: async (id, eventData) => {
    set({ loading: true, error: null });
    
    try {
      const eventId = parseInt(id);
      // Пробуем разные варианты эндпоинтов
      const endpoints = [
        `${API_BASE_URL}/events/${eventId}`,
        `${API_BASE_URL}/events/update/${eventId}`,
        `${API_BASE_URL}/events/edit/${eventId}`,
        `${API_BASE_URL}/events/${eventId}/update`
      ];
      
      let lastError = null;
      
      // Пробуем каждый эндпоинт
      for (const url of endpoints) {
        console.log(`📡 Пробуем POST запрос:`, url);
        
        try {
          const response = await fetch(url, {
            method: 'POST', // Используем POST вместо PUT
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          });
          
          console.log(`📥 Статус ответа для ${url}:`, response.status);
          
          if (response.ok) {
            const responseText = await response.text();
            let updatedEvent;
            try {
              updatedEvent = JSON.parse(responseText);
            } catch (e) {
              updatedEvent = { ...eventData, id: eventId };
            }
            
            console.log('✅ Обновлено событие через:', url);
            
            set((state) => ({
              events: state.events.map(event => 
                event.id === eventId ? updatedEvent : event
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
  
  // Удаление мероприятия
  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const eventId = parseInt(id);
      // Пробуем DELETE
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📥 DELETE статус:', response.status);
      
      if (!response.ok) {
        // Если DELETE не работает, пробуем POST с _method
        console.log('🔄 Пробуем POST с _method=DELETE');
        const postResponse = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ _method: 'DELETE' }),
        });
        
        if (!postResponse.ok) {
          throw new Error(`Ошибка: ${postResponse.status}`);
        }
      }
      
      set((state) => ({
        events: state.events.filter(event => event.id !== eventId),
        selectedEvent: state.selectedEvent?.id === eventId ? null : state.selectedEvent,
        loading: false
      }));
      
      return true;
      
    } catch (error) {
      console.error('Ошибка удаления мероприятия:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  clearError: () => set({ error: null }),
  clearSelectedEvent: () => set({ selectedEvent: null }),
}));

// Селекторы
export const useEvents = () => useEventStore((state) => state.events);
export const useEventLoading = () => useEventStore((state) => state.loading);
export const useEventError = () => useEventStore((state) => state.error);
export const useSelectedEvent = () => useEventStore((state) => state.selectedEvent);
export const useTotalPages = () => useEventStore((state) => state.totalPages);
export const useCurrentPage = () => useEventStore((state) => state.currentPage);

export default useEventStore;