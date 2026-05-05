import React, { useState, useEffect } from "react";
import "./orders.css";

const STATUS_OPTIONS = [
  { value: "new", label: "Новый" },
  { value: "processing", label: "В обработке" },
  { value: "assembled", label: "Собран" },
  { value: "ready", label: "Готов к выдаче" },
  { value: "received", label: "Получен" },
  { value: "cancelled", label: "Отменен" },
];

const INITIAL_ORDERS = [
  {
    id: 1,
    orderNumber: 1,
    customer: "Восемкин Петр Николаевич",
    group: "8К32",
    products: ["Футболка", "Блокнот", "Ручка"],
    status: "received",
  },
  {
    id: 2,
    orderNumber: 2,
    customer: "Громкин Иван Андреевич",
    group: "8К22",
    products: ["Блокнот", "Ручка"],
    status: "assembled",
  },
  {
    id: 3,
    orderNumber: 3,
    customer: "Иванов Иван Иванович",
    group: "ИСП-42",
    products: ["Футболка черная (M)", "Носки спортивные", "Браслет"],
    status: "new",
  },
];

const loadOrders = () => {
  const saved = localStorage.getItem("ordersData");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_ORDERS;
    }
  }
  return INITIAL_ORDERS;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState(loadOrders);
  const [editedOrders, setEditedOrders] = useState(() => {
    const data = loadOrders();
    return data.reduce((acc, o) => {
      acc[o.id] = o.status;
      return acc;
    }, {});
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleStatusChange = (orderId, newStatus) => {
    setEditedOrders((prev) => ({
      ...prev,
      [orderId]: newStatus,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updatedOrders = orders.map((order) => ({
      ...order,
      status: editedOrders[order.id] ?? order.status,
    }));
    setOrders(updatedOrders);
    setEditedOrders(
      updatedOrders.reduce((acc, o) => {
        acc[o.id] = o.status;
        return acc;
      }, {})
    );
    setHasChanges(false);
    localStorage.setItem("ordersData", JSON.stringify(updatedOrders));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <section className="ordersPage">
      {showToast && (
        <div className="ordersToast">Изменения сохранены</div>
      )}
      <h1 className="ordersPageTitle">Заказы</h1>

      <div className="ordersContentContainer">
        <div className="ordersMainContent">
          <table className="ordersTable">
            <thead>
              <tr>
                <th className="orderNumber">№</th>
                <th className="orderCustomer">ФИО</th>
                <th className="orderGroup">Группа</th>
                <th className="orderProducts">Товары</th>
                <th className="orderStatus">Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="orderNumber">{order.orderNumber}</td>
                  <td className="orderCustomer">{order.customer}</td>
                  <td className="orderGroup">{order.group}</td>
                  <td className="orderProducts">
                    {order.products.map((product, index) => (
                      <div key={index} className="productItem">
                        {product}
                      </div>
                    ))}
                  </td>
                  <td className="orderStatus">
                    <select
                      className="statusSelect"
                      value={editedOrders[order.id]}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="actionButtons">
            {hasChanges && (
              <button className="saveButton" onClick={handleSave}>
                Сохранить
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrdersPage;


