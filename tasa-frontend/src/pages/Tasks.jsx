import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../config";

export default function Tasks() {

  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState([]);

  const token = localStorage.getItem("token");

  const getTasks = useCallback(async () => {

    const res = await fetch(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    setTasks(data || []);

  }, [token]);

  useEffect(() => {
    getTasks();
  }, [getTasks]);

  const addTask = async () => {

    await fetch(`${API_URL}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title })
    });

    setTitle("");
    getTasks();
  };

  const deleteTask = async (id) => {

    await fetch(`${API_URL}/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    getTasks();
  };

  const toggleTask = async (id) => {

    await fetch(`${API_URL}/api/tasks/toggle/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });

    getTasks();
  };

  return (
    <div>

      <h2>Tasks</h2>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <button onClick={addTask}>Add</button>

      {tasks.map(task => (

        <div key={task._id}>

          {task.title}

          <button onClick={() => toggleTask(task._id)}>Done</button>

          <button onClick={() => deleteTask(task._id)}>Delete</button>

        </div>

      ))}

    </div>
  );
}