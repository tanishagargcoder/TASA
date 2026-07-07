import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((text, type = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`fade-up px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl border text-sm font-medium ${
              t.type === "error"
                ? "bg-red-100/90 border-red-200 text-red-700 dark:bg-red-900/80 dark:border-red-800 dark:text-red-200"
                : "bg-white/90 border-white/60 text-gray-800 dark:bg-gray-800/90 dark:border-gray-700 dark:text-gray-100"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
