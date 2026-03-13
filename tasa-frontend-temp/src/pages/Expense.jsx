import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Expense() {

  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const API = `${API_URL}/api/expenses`;

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {

    const res = await axios.get(API);
    setExpenses(res.data);

  };

  const addExpense = async () => {

    const res = await axios.post(API, { title, amount });

    setExpenses([...expenses, res.data]);
    setTitle("");
    setAmount("");
  };

  const deleteExpense = async (id) => {

    await axios.delete(`${API}/${id}`);
    setExpenses(expenses.filter(e => e._id !== id));
  };

  return (
    <div>

      <h2>Expenses</h2>

      <input
        placeholder="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={addExpense}>Add</button>

      {expenses.map(e => (

        <div key={e._id}>

          {e.title} ₹{e.amount}

          <button onClick={() => deleteExpense(e._id)}>
            Delete
          </button>

        </div>

      ))}

    </div>
  );
}