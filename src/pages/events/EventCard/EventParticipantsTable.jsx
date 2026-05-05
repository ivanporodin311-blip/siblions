import React, { useState, useRef, useEffect } from "react";
import "./EventParticipantsTable.css";

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14.5 1.62132C14.8978 1.2235 15.4374 1 16 1C16.2786 1 16.5544 1.05487 16.8118 1.16148C17.0692 1.26808 17.303 1.42434 17.5 1.62132C17.697 1.8183 17.8532 2.05216 17.9598 2.30953C18.0665 2.5669 18.1213 2.84274 18.1213 3.12132C18.1213 3.3999 18.0665 3.67574 17.9598 3.93311C17.8532 4.19048 17.697 4.42434 17.5 4.62132L5 17.1213L1 18.1213L2 14.1213L14.5 1.62132Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EventParticipantsTable = ({
  participants,
  onPointsChange,
  participantTotals,
  onEditParticipant,
  onDeleteParticipant,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", group: "", school: "" });
  const editingRowRef = useRef(null);

  const handleEditClick = (participant) => {
    if (editingId === participant.id) {
      if (onEditParticipant) onEditParticipant(participant.id, editForm);
      setEditingId(null);
      return;
    }
    setEditingId(participant.id);
    setEditForm({
      name: participant.name,
      group: participant.group || "",
      school: participant.school || "",
    });
  };

  useEffect(() => {
    if (!editingId) return;
    const handleMouseDown = (e) => {
      if (editingRowRef.current && !editingRowRef.current.contains(e.target)) {
        if (onEditParticipant) onEditParticipant(editingId, editForm);
        setEditingId(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [editingId, editForm, onEditParticipant]);

  return (
    <div className="participantsTable">
      <div className="tableHeader">
        <div className="tableRow">
          <div className="tableCell edit"></div>
          <div className="tableCell number">№</div>
          <div className="tableCell name">ФИО</div>
          <div className="tableCell group">Группа</div>
          <div className="tableCell school">Школа</div>
          <div className="tableCell points">Баллы</div>
          <div className="tableCell total">Общие баллы</div>
          <div className="tableCell delete"></div>
        </div>
      </div>

      <div className="tableBody">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            ref={editingId === participant.id ? editingRowRef : null}
            className={`tableRow ${editingId === participant.id ? "editing" : ""}`}
          >
            <div className="tableCell edit">
              <button
                type="button"
                className="tableActionBtn tableActionBtn--edit"
                onClick={() => handleEditClick(participant)}
                aria-label="Редактировать участника"
                title="Редактировать"
              >
                <EditIcon />
              </button>
            </div>
            <div className="tableCell number">{index + 1}</div>
            {editingId === participant.id ? (
              <>
                <div className="tableCell name">
                  <input
                    type="text"
                    className="tableEditInput"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="ФИО"
                  />
                </div>
                <div className="tableCell group">
                  <input
                    type="text"
                    className="tableEditInput"
                    value={editForm.group}
                    onChange={(e) => setEditForm((f) => ({ ...f, group: e.target.value }))}
                    placeholder="Группа"
                  />
                </div>
                <div className="tableCell school">
                  <input
                    type="text"
                    className="tableEditInput"
                    value={editForm.school}
                    onChange={(e) => setEditForm((f) => ({ ...f, school: e.target.value }))}
                    placeholder="Школа"
                  />
                </div>
                <div className="tableCell points">
                  <input
                    type="number"
                    min={0}
                    value={participant.points || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
                      onPointsChange(participant.id, num);
                    }}
                    className="pointsInput"
                    placeholder="0"
                  />
                </div>
                <div className="tableCell total">
                  {participantTotals?.[participant.id] ?? 0}
                </div>
                <div className="tableCell delete">
                  <button
                    type="button"
                    className="tableActionBtn tableActionBtn--delete"
                    onClick={() => onDeleteParticipant?.(participant)}
                    aria-label="Удалить участника"
                    title="Удалить"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="tableCell name">{participant.name}</div>
                <div className="tableCell group">{participant.group}</div>
                <div className="tableCell school">{participant.school}</div>
                <div className="tableCell points">
                  <input
                    type="number"
                    min={0}
                    value={participant.points || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
                      onPointsChange(participant.id, num);
                    }}
                    className="pointsInput"
                    placeholder="0"
                  />
                </div>
                <div className="tableCell total">
                  {participantTotals?.[participant.id] ?? 0}
                </div>
                <div className="tableCell delete">
                  <button
                    type="button"
                    className="tableActionBtn tableActionBtn--delete"
                    onClick={() => onDeleteParticipant?.(participant)}
                    aria-label="Удалить участника"
                    title="Удалить"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventParticipantsTable;
