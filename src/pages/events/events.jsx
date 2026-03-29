import React, { useState, useEffect } from "react";
import "./events.css";
import TitleWithAddButton from "./title/titleWithAddButton/titleWithAddButton";
import FutureEventsButton from "./title/futureEventsButton/futureEventsButton";
import PastEventsButton from "./title/pastEventsButton/pastEventsButton";
import ModalAddWindow from "./modalAddWindow/modalAddWindow";
import EventCard from "./EventCard/EventCard";
import useEventStore from "../../stores/eventStore"; // Импорт store

function EventsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("future");
  
  // Используем store вместо localStorage
  const { events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent, clearError } = useEventStore();

  // Загрузка событий при монтировании
  useEffect(() => {
    fetchEvents();
  }, []);

  // Восстановление скролла
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("eventsScrollPosition");
    if (savedScroll !== null) {
      sessionStorage.removeItem("eventsScrollPosition");
      const y = parseInt(savedScroll, 10) || 0;
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    }
  }, []);

  const handleAddClick = () => {
    setModalMode("create");
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setModalMode("edit");
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCreateEvent = async (newEventData) => {
    const result = await createEvent(newEventData);
    if (result) {
      setIsModalOpen(false);
    }
  };

  const handleUpdateEvent = async (updatedEventData) => {
    const result = await updateEvent(editingEvent.id, updatedEventData);
    if (result) {
      setIsModalOpen(false);
      setEditingEvent(null);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Вы уверены, что хотите удалить это мероприятие?")) {
      await deleteEvent(eventId);
    }
  };

  const handleDeleteEventFromModal = () => {
    if (editingEvent) {
      handleDeleteEvent(editingEvent.id);
    }
  };

  const filterEvents = (tab) => {
    const now = new Date();
    return events
      .filter((event) => {
        const eventDate = new Date(event.date || event.startDate);
        if (tab === "future") {
          return eventDate >= now;
        } else {
          return eventDate < now;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.startDate);
        const dateB = new Date(b.date || b.startDate);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const displayedEvents = filterEvents(activeTab);

  // Показ загрузки
  if (loading && events.length === 0) {
    return (
      <section className="eventsPage">
        <div className="eventsHeaderSection">
          <TitleWithAddButton title="Мероприятия" onAddClick={handleAddClick} />
        </div>
        <div className="loadingSpinner">Загрузка мероприятий...</div>
      </section>
    );
  }

  // Показ ошибки
  if (error) {
    return (
      <section className="eventsPage">
        <div className="eventsHeaderSection">
          <TitleWithAddButton title="Мероприятия" onAddClick={handleAddClick} />
        </div>
        <div className="errorMessage">
          Ошибка: {error}
          <button onClick={() => { clearError(); fetchEvents(); }}>Повторить</button>
        </div>
      </section>
    );
  }

  return (
    <section className="eventsPage">
      <div className="eventsHeaderSection">
        <TitleWithAddButton title="Мероприятия" onAddClick={handleAddClick} />
        <div className="eventsTabsContainer">
          <PastEventsButton
            isActive={activeTab === "past"}
            onClick={() => setActiveTab("past")}
          />
          <FutureEventsButton
            isActive={activeTab === "future"}
            onClick={() => setActiveTab("future")}
          />
        </div>
      </div>

      <div className="eventsGrid">
        {displayedEvents.length > 0 ? (
          displayedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEditEvent}
            />
          ))
        ) : (
          <p className="noEventsMessage">
            {activeTab === "future"
              ? "Пока нет будущих мероприятий."
              : "Пока нет прошедших мероприятий."}
          </p>
        )}
      </div>

      {isModalOpen && (
        <ModalAddWindow
          onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
          }}
          onSubmit={
            modalMode === "create" ? handleCreateEvent : handleUpdateEvent
          }
          onDelete={handleDeleteEventFromModal}
          eventToEdit={editingEvent}
          mode={modalMode}
        />
      )}
    </section>
  );
}

export default EventsPage;