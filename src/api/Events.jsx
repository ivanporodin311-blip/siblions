// GET /api/events
// Получить все мероприятия
Response: [
  {
    id: string,
    title: string,
    location: string,
    date: string,
    time?: string,
    sportType?: string,
    eventLevel?: string,
    description?: string,
    tasks?: string,
    organizers?: string,
    points: number,
    attachedFileName?: string,
    attachedFileData?: string
  }
]

// GET /api/events/:eventId
// Получить конкретное мероприятие

// POST /api/events
// Создать новое мероприятие
Body: {
  title: string,
  location: string,
  date: string,
  time?: string,
  sportType?: string,
  eventLevel?: string,
  description?: string,
  tasks?: string,
  organizers?: string,
  points: number,
  attachedFileName?: string,
  attachedFileData?: string
}

// PUT /api/events/:eventId
// Обновить мероприятие

// DELETE /api/events/:eventId
// Удалить мероприятие