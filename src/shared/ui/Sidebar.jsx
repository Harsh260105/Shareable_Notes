import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  RiFileTextLine,
  RiDeleteBin6Line,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiSunLine,
  RiMoonLine,
} from "react-icons/ri";
import { useTheme } from "../hooks/useTheme";

const Sidebar = ({
  activeFolder,
  onSelectFolder,
  onToggleTheme,
  onCollapse,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const trashedNotes = useSelector((state) =>
    state.notes.notes.filter((note) => note.isTrashed)
  );
  const folders = [
    {
      id: "notes",
      name: "All Notes",
      icon: "📝",
    },
    {
      id: "trash",
      name: "Trash",
      icon: "🗑️",
      count: trashedNotes.length,
    },
  ];

  return (
    <div
      className={`flex flex-col h-full bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 transition-all ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        {!isCollapsed && <h1 className="text-xl font-bold">NoteShare</h1>}{" "}
        <button
          type="button"
          onClick={() => {
            const newCollapsedState = !isCollapsed;
            setIsCollapsed(newCollapsedState);
            // Notify parent component about the collapse state change
            if (onCollapse) {
              onCollapse(newCollapsedState);
            }
          }}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {isCollapsed ? (
            <RiArrowRightSLine size={22} />
          ) : (
            <RiArrowLeftSLine size={22} />
          )}
        </button>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-auto">
        <ul className="py-2">
          {folders.map((folder) => (
            <li key={folder.id}>
              {" "}
              <button
                type="button"
                onClick={() => onSelectFolder(folder.id)}
                className={`flex items-center w-full px-4 py-3 text-left rounded-lg my-1 transition-all duration-200 ease-in-out ${
                  activeFolder === folder.id
                    ? "bg-blue-300 dark:bg-blue-800 text-neutral-800 dark:text-blue-200 shadow-sm font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span
                  className={`text-xl ${
                    activeFolder === folder.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {folder.icon}
                </span>
                {!isCollapsed && (
                  <span
                    className={`flex-1 ml-3 ${
                      activeFolder === folder.id ? "font-medium" : ""
                    }`}
                  >
                    {folder.name}
                  </span>
                )}
                {!isCollapsed && folder.count > 0 && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      activeFolder === folder.id
                        ? "bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {folder.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-300 dark:border-gray-700">
        <button
          type="button"
          onClick={() => {
            toggleTheme();
            if (onToggleTheme) onToggleTheme();
          }}
          className={`flex items-center ${
            isCollapsed ? "justify-center" : ""
          } w-full p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800`}
        >
          {isDarkMode ? (
            <RiSunLine className="text-yellow-500" size={22} />
          ) : (
            <RiMoonLine className="text-indigo-600" size={22} />
          )}
          {!isCollapsed && <span className="ml-2">Toggle Theme</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
