import React, { useState, useEffect, useCallback } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);

  // 📝 NOTES
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // ⭐ FILTER
  const [filter, setFilter] = useState("all");

  // 🔁 Load token on refresh
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  // 👤 GET PROFILE
  const getProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUser(data);
    } catch (err) {
      console.log(err);
    }
  };

  // 📥 GET TASKS
  const getTasks = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setTasks(data);
      else setTasks([]);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // 📥 GET NOTES
  const getNotes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setNotes(data);
      else setNotes([]);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ TOGGLE TASK
  const toggleTask = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/toggle/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        alert("Toggle failed");
        return;
      }

      getTasks();
    } catch (err) {
      alert("Server error");
    }
  };

  // 🔁 Load everything after login
  useEffect(() => {
    if (token) {
      getTasks();
      getProfile();
      getNotes();
    }
  }, [token, getTasks]);

  // 🔐 LOGIN
  const login = async () => {
    if (!email || !password) {
      alert("Email & password required");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        alert("Login failed");
        return;
      }

      setToken(data.token);
      localStorage.setItem("token", data.token);
      alert("Login successful");
    } catch (err) {
      alert("Server error");
    }
  };

  // 🆕 REGISTER
  const register = async () => {
    if (!name || !email || !password) {
      alert("All fields required");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Register failed");
        return;
      }

      alert("Registered successfully ❤️ Please login");
      setIsRegister(false);
    } catch (err) {
      alert("Server error");
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
    setNotes([]);
    setUser(null);
    alert("Logged out");
  };

  // ➕ ADD TASK
  const addTask = async () => {
    if (!title) {
      alert("Enter task title");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        alert("Task add failed");
        return;
      }

      alert("Task added");
      setTitle("");
      getTasks();
    } catch (err) {
      alert("Server error");
    }
  };

  // 🗑 DELETE TASK
  const deleteTask = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        alert("Delete failed");
        return;
      }

      alert("Task deleted");
      getTasks();
    } catch (err) {
      alert("Server error");
    }
  };

  // ✏ UPDATE TASK
  const updateTask = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editText }),
      });

      if (!res.ok) {
        alert("Update failed");
        return;
      }

      alert("Task updated");
      setEditingId(null);
      setEditText("");
      getTasks();
    } catch (err) {
      alert("Server error");
    }
  };

  // ➕ ADD NOTE
  const addNote = async () => {
    if (!noteTitle || !noteContent) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
        }),
      });

      if (!res.ok) {
        alert("Failed");
        return;
      }

      alert("Note added");
      setNoteTitle("");
      setNoteContent("");
      getNotes();
    } catch (err) {
      alert("Server error");
    }
  };

  // 🗑 DELETE NOTE
  const deleteNote = async (id) => {
    await fetch(`http://localhost:5000/api/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    getNotes();
  };

  return (
    <div style={{ padding: 40, maxWidth: 500 }}>
      {!token ? (
        <>
          <h2>{isRegister ? "Register" : "Login"}</h2>

          {isRegister && (
            <>
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <br /><br />
            </>
          )}

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br /><br />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br /><br />

          {isRegister ? (
            <button onClick={register}>Register</button>
          ) : (
            <button onClick={login}>Login</button>
          )}

          <br /><br />

          <button onClick={() => setIsRegister(!isRegister)}>
            {isRegister
              ? "Already have account? Login"
              : "New user? Register"}
          </button>
        </>
      ) : (
        <>
          {user && <h3>Welcome, {user.name} 👋</h3>}
          <button onClick={logout}>Logout</button>

          <hr />

          {/* TASKS */}
          <h2>Add Task</h2>
          <input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <br /><br />
          <button onClick={addTask}>Add Task</button>

          <hr />

          <h3>Filter</h3>
          <button onClick={() => setFilter("all")}>All</button>
          <button onClick={() => setFilter("completed")}>Completed</button>
          <button onClick={() => setFilter("pending")}>Pending</button>

          <h2>My Tasks</h2>
          <ul>
            {tasks
              .filter((task) => {
                if (filter === "completed") return task.completed;
                if (filter === "pending") return !task.completed;
                return true;
              })
              .map((task) => (
                <li key={task._id}>
                  <span>
                    {task.title}
                  </span>{" "}
                  <button onClick={() => toggleTask(task._id)}>
                    {task.completed ? "Undo" : "Done"}
                  </button>{" "}
                  <button
                    onClick={() => {
                      setEditingId(task._id);
                      setEditText(task.title);
                    }}
                  >
                    Edit
                  </button>{" "}
                  <button onClick={() => deleteTask(task._id)}>
                    Delete
                  </button>
                </li>
              ))}
          </ul>

          <hr />

          {/* NOTES */}
          <h2>Notes</h2>

          <input
            placeholder="Title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <br /><br />

          <textarea
            placeholder="Content"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <br /><br />

          <button onClick={addNote}>Add Note</button>

          <ul>
            {notes.map((note) => (
              <li key={note._id}>
                <b>{note.title}</b>: {note.content}{" "}
                <button onClick={() => deleteNote(note._id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
