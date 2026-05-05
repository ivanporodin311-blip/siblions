// Центральная база всех участников
const getAllParticipants = () => {
  const saved = localStorage.getItem("all_participants");
  if (saved) {
    return JSON.parse(saved);
  }

  // Начальные данные участников (одинаковые для всех мероприятий)
  const initialParticipants = [
    { id: 1, name: "Иванов Иван", group: "Группа 1", school: "Школа №1" },
    { id: 2, name: "Петров Петр", group: "Группа 2", school: "Школа №2" },
    { id: 3, name: "Сидорова Анна", group: "Группа 1", school: "Школа №1" },
    { id: 4, name: "Кузнецов Алексей", group: "Группа 3", school: "Школа №3" },
    { id: 5, name: "Смирнова Мария", group: "Группа 2", school: "Школа №2" },
    { id: 6, name: "Федоров Дмитрий", group: "Группа 1", school: "Школа №1" },
    { id: 7, name: "Николаева Елена", group: "Группа 3", school: "Школа №3" },
  ];

  localStorage.setItem("all_participants", JSON.stringify(initialParticipants));
  return initialParticipants;
};

// Получить баллы участников для конкретного мероприятия (миграция со старого формата)
const getEventPoints = (eventId, eventPointsDefault) => {
  const pointsKey = `event_${eventId}_points`;
  const attendanceKey = `event_${eventId}_attendance`;

  const savedPoints = localStorage.getItem(pointsKey);
  if (savedPoints) {
    const parsed = JSON.parse(savedPoints);
    const result = {};
    Object.keys(parsed).forEach((id) => {
      const v = parsed[id];
      result[id] = typeof v === "number" ? v : Number(v) || 0;
    });
    return result;
  }

  // Миграция: старый формат attendance (boolean)
  const savedAttendance = localStorage.getItem(attendanceKey);
  if (savedAttendance) {
    const attendance = JSON.parse(savedAttendance);
    const points = eventPointsDefault || 0;
    const result = {};
    Object.keys(attendance).forEach((id) => {
      const attended = attendance[id];
      result[id] = attended ? points : 0;
    });
    localStorage.setItem(pointsKey, JSON.stringify(result));
    return result;
  }

  return {};
};

// Сохранить баллы участников для мероприятия
const saveEventPoints = (eventId, participants) => {
  const points = {};
  participants.forEach((p) => {
    points[p.id] = Math.max(0, Number(p.points) || 0);
  });
  localStorage.setItem(`event_${eventId}_points`, JSON.stringify(points));
};

// Общие баллы участника по всем сохранённым мероприятиям
const getTotalPointsForParticipant = (participantId) => {
  const eventsJson = localStorage.getItem("events");
  if (!eventsJson) return 0;

  const events = JSON.parse(eventsJson);
  let total = 0;

  events.forEach((event) => {
    const eventPointsMap = getEventPoints(event.id, event.points);
    total += eventPointsMap[participantId] || 0;
  });

  return total;
};

// Добавить нового участника вручную
const addParticipant = (name, group, school) => {
  const allParticipants = getAllParticipants();
  const newParticipant = {
    id: Date.now(),
    name,
    group,
    school,
  };
  allParticipants.push(newParticipant);
  localStorage.setItem("all_participants", JSON.stringify(allParticipants));
  return newParticipant;
};

// Обновить данные участника
const updateParticipant = (id, { name, group, school }) => {
  const allParticipants = getAllParticipants();
  const index = allParticipants.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const updated = {
    ...allParticipants[index],
    ...(name !== undefined && { name }),
    ...(group !== undefined && { group }),
    ...(school !== undefined && { school }),
  };
  allParticipants[index] = updated;
  localStorage.setItem("all_participants", JSON.stringify(allParticipants));
  return updated;
};

// Удалить участника из базы
const removeParticipant = (id) => {
  const allParticipants = getAllParticipants().filter((p) => p.id !== id);
  localStorage.setItem("all_participants", JSON.stringify(allParticipants));
};

// Получить участников для мероприятия с их баллами
const getParticipantsForEvent = (eventId, eventPointsDefault) => {
  const allParticipants = getAllParticipants();
  const eventPointsMap = getEventPoints(eventId, eventPointsDefault);

  return allParticipants.map((participant) => ({
    ...participant,
    points: eventPointsMap[participant.id] ?? 0,
  }));
};

export {
  getAllParticipants,
  getEventPoints,
  saveEventPoints,
  getTotalPointsForParticipant,
  addParticipant,
  getParticipantsForEvent,
  updateParticipant,
  removeParticipant,
};
