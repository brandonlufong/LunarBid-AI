// src/components/DarkModeToggle.jsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-14 h-8 flex items-center rounded-full p-1
        ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}
        transition-colors duration-300
      `}
    >
      <span
        className={`
          absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow-md
          transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}
          transition-transform duration-300
          flex items-center justify-center text-yellow-400
        `}
      >
        {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </span>
    </button>
  );
};

export default DarkModeToggle;
