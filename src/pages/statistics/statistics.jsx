import React, { useMemo, useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import useEventStore from "../../stores/eventStore";
import "./statistics.css";

const STATISTICS_DATE_KEY = "statisticsDateRange";

const getDefaultDateRange = () => {
  const saved = localStorage.getItem(STATISTICS_DATE_KEY);
  if (saved) {
    try {
      const { from, to } = JSON.parse(saved);
      if (from && to) return { from, to };
    } catch {}
  }
  const now = new Date();
  const start = new Date(now.getFullYear() - 5, 0, 1);
  const end = new Date(now.getFullYear() + 1, 11, 31);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
};

const STATUS_LABELS = {
  new: "Новый",
  processing: "В обработке",
  assembled: "Собран",
  ready: "Готов к выдаче",
  received: "Получен",
  cancelled: "Отменен",
};

const StatisticsPage = () => {
  const defaultRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const reportRef = useRef(null);

  const store = useEventStore();
  const events = store.events || [];
  const fetchEvents = store.fetchEvents;
  const eventsLoading = store.loading || false;
  const [localOrders, setLocalOrders] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      console.log('📊 Загрузка данных...');
      if (fetchEvents) {
        await fetchEvents(1, 1000);
      }
      
      const ordersJson = localStorage.getItem("ordersData") || localStorage.getItem("orders");
      if (ordersJson) {
        try {
          const parsed = JSON.parse(ordersJson);
          setLocalOrders(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error('Ошибка парсинга заказов:', e);
        }
      }
    };
    loadData();
  }, [fetchEvents]);

  const saveDateRange = (from, to) => {
    localStorage.setItem(STATISTICS_DATE_KEY, JSON.stringify({ from, to }));
  };

  const reportData = useMemo(() => {
    try {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);

      // Фильтруем по startDate
      const eventsInPeriod = events.filter((event) => {
        if (!event.startDate) return true;
        const d = new Date(event.startDate);
        return d >= from && d <= to;
      });

      // Группировка по месяцам для диаграммы
      const monthData = {};
      eventsInPeriod.forEach((event) => {
        let d;
        if (event.startDate) {
          d = new Date(event.startDate);
        } else {
          d = new Date();
        }
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthData[key]) {
          monthData[key] = {
            month: d.toLocaleDateString("ru-RU", { month: "short", year: "numeric" }),
            events: 0,
            participants: 0,
          };
        }
        monthData[key].events += 1;
        // Пока заглушка 0, потом заменишь на реальных участников
        monthData[key].participants += 0;
      });

      const chartData = Object.entries(monthData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);

      return {
        totalEvents: eventsInPeriod.length,
        totalParticipants: 0, // Заглушка
        totalParticipations: 0, // Заглушка
        allEvents: eventsInPeriod.map((event) => ({
          id: event.id || event.uuid,
          name: event.title,
          date: event.startDate || new Date().toISOString(),
          participants: 0, // Заглушка
        })).sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);
        }),
        chartData: chartData.length > 0 ? chartData : [{ month: "—", events: 0, participants: 0 }],
        ordersCount: localOrders.length,
      };
    } catch (err) {
      console.error('Ошибка:', err);
      return {
        totalEvents: 0,
        totalParticipants: 0,
        totalParticipations: 0,
        allEvents: [],
        chartData: [{ month: "—", events: 0, participants: 0 }],
        ordersCount: 0,
      };
    }
  }, [dateFrom, dateTo, events, localOrders]);

  const handleExportPDF = () => {
    const el = reportRef.current;
    if (!el) return;
    const clone = el.cloneNode(true);
    clone.querySelectorAll("[data-pdf-exclude]").forEach((node) => node.remove());
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:fixed;left:-9999px;top:0;width:757px;";
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    const opt = {
      margin: 5,
      filename: `Отчёт_${dateFrom}_${dateTo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 1, width: 757, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf()
      .set(opt)
      .from(clone)
      .save()
      .finally(() => {
        if (wrapper.parentNode) document.body.removeChild(wrapper);
      });
  };

  const handleExportExcel = () => {
    const periodLabel = `${dateFrom} — ${dateTo}`;

    const summaryRows = [
      ["Отчёт за период", periodLabel],
      [""],
      ["Число мероприятий", reportData.totalEvents],
      ["Участники (общее количество)", reportData.totalParticipations],
      ["Участники (уникальные)", reportData.totalParticipants],
      ["Количество заказов", reportData.ordersCount],
    ];

    const eventsRows = [
      ["№", "Мероприятие", "Дата", "Участников"],
      ...reportData.allEvents.map((e, i) => [
        i + 1,
        e.name,
        e.date ? new Date(e.date).toLocaleDateString("ru-RU") : "Дата не указана",
        e.participants,
      ]),
    ];

    const chartDataForExport = reportData.chartData.filter((d) => d.month !== "—");
    const monthlyRows = [
      ["Период", "Мероприятия", "Участники"],
      ...chartDataForExport.map((d) => [d.month, d.events, d.participants]),
    ];

    const ordersRows = [
      ["№", "ФИО", "Группа", "Товары", "Статус"],
      ...localOrders.map((o, idx) => [
        idx + 1,
        o.customer || o.customerName || "—",
        o.group || "—",
        Array.isArray(o.products) ? o.products.join("; ") : (o.items || []).join("; "),
        STATUS_LABELS[o.status] || o.status || "—",
      ]),
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    const wsEvents = XLSX.utils.aoa_to_sheet(eventsRows);
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows);
    const wsOrders = XLSX.utils.aoa_to_sheet(ordersRows);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Сводка");
    XLSX.utils.book_append_sheet(workbook, wsEvents, "Мероприятия");
    XLSX.utils.book_append_sheet(workbook, wsMonthly, "По месяцам");
    XLSX.utils.book_append_sheet(workbook, wsOrders, "Заказы");

    wsSummary["!cols"] = [{ wch: 35 }, { wch: 25 }];
    wsEvents["!cols"] = [{ wch: 6 }, { wch: 40 }, { wch: 14 }, { wch: 12 }];
    wsMonthly["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }];
    wsOrders["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 40 }, { wch: 18 }];

    XLSX.writeFile(workbook, `Отчёт_${dateFrom}_${dateTo}.xlsx`);
  };

  return (
    <section className="statisticsPage">
      <h1 className="statisticsTitle">Статистика</h1>

      {eventsLoading && <p className="loadingText">Загрузка данных...</p>}

      <div className="statisticsInfoContainer">
        <div ref={reportRef} className="statisticsReportContent">
          <div className="statisticsHeader">
            <h2 className="statisticsMainTitle">Отчёт за указанный период</h2>
            <div className="statisticsPeriod">
              <div className="statisticsDateRange">
                <label className="statisticsDateLabel">
                  С
                  <input
                    type="date"
                    className="statisticsDateInput"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      saveDateRange(e.target.value, dateTo);
                    }}
                  />
                </label>
                <label className="statisticsDateLabel">
                  По
                  <input
                    type="date"
                    className="statisticsDateInput"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      saveDateRange(dateFrom, e.target.value);
                    }}
                  />
                </label>
                <button 
                  onClick={() => {
                    if (events.length > 0) {
                      const dates = events.map(e => e.startDate ? new Date(e.startDate) : new Date());
                      const minDate = new Date(Math.min(...dates));
                      const maxDate = new Date(Math.max(...dates));
                      setDateFrom(minDate.toISOString().slice(0, 10));
                      setDateTo(maxDate.toISOString().slice(0, 10));
                      saveDateRange(minDate.toISOString().slice(0, 10), maxDate.toISOString().slice(0, 10));
                    } else {
                      setDateFrom("2020-01-01");
                      setDateTo("2030-12-31");
                      saveDateRange("2020-01-01", "2030-12-31");
                    }
                  }}
                  style={{marginLeft: '10px', padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Показать всё
                </button>
              </div>
            </div>
          </div>

          <div className="statisticsGrid">
            <div className="statCard">
              <h3 className="statCardTitle">Мероприятия</h3>
              <p className="statCardValue">{reportData.totalEvents}</p>
              <p className="statCardDescription">Общее количество</p>
            </div>

            <div className="statCard">
              <h3 className="statCardTitle">Участники</h3>
              <p className="statCardValue">{reportData.totalParticipations}</p>
              <p className="statCardDescription">Всего</p>
            </div>

            <div className="statCard">
              <h3 className="statCardTitle">Участники</h3>
              <p className="statCardValue">{reportData.totalParticipants}</p>
              <p className="statCardDescription">Уникальные</p>
            </div>

            <div className="statCard">
              <h3 className="statCardTitle">Заказы</h3>
              <p className="statCardValue">{reportData.ordersCount}</p>
              <p className="statCardDescription">Общее количество</p>
            </div>
          </div>

          <div className="chartContainer" data-pdf-exclude>
            <h3 className="chartTitle chartTitle--centered">Диаграмма мероприятий и участников по месяцам</h3>
            <div className="chartWrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="events" fill="var(--blueColor)" name="Мероприятия" />
                  <Bar dataKey="participants" fill="#94a3b8" name="Участники" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="statisticsTableContainer">
            <h3 className="chartTitle" style={{ marginBottom: "20px" }}>
              Мероприятия за период
            </h3>
            {reportData.allEvents.length > 0 ? (
              <table className="statisticsTable">
                <thead>
                  <tr>
                    <th>Мероприятие</th>
                    <th>Дата</th>
                    <th>Участников</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.allEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{event.name}</td>
                      <td>
                        {new Date(event.date).toLocaleDateString("ru-RU")}
                      </td>
                      <td>{event.participants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="statisticsEmptyText">Нет мероприятий за выбранный период</p>
            )}
          </div>
        </div>

        <div className="exportButtons">
          <button className="exportButton" onClick={handleExportPDF}>
            Экспорт в PDF
          </button>
          <button className="exportButton" onClick={handleExportExcel}>
            Экспорт в Excel
          </button>
        </div>
      </div>
    </section>
  );
};

export default StatisticsPage;