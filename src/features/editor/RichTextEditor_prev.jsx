import { useState, useEffect, useRef } from "react";
import { useRichTextEditor } from "./useRichTextEditor";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from "react-icons/fa";

const RichTextEditor = ({
  initialContent = "",
  onChange,
  onBlur,
  placeholder = "Write your note...",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const lastSavedContentRef = useRef(initialContent);
  const {
    editorRef,
    content,
    setContent,
    formatText,
    activeFormats,
    handleKeyDown,
    handleInput,
    handleClick,
    handleCompositionStart,
    handleCompositionEnd,
  } = useRichTextEditor(initialContent, (newContent) => {
    if (newContent !== lastSavedContentRef.current) {
      lastSavedContentRef.current = newContent;
      if (onChange) onChange(newContent);
    }
  });

  useEffect(() => {
    if (!initialContent || isFocused) return;
    if (!editorRef.current) return;

    const currentContent = editorRef.current.innerHTML;
    const cleanCurrentContent = currentContent.replace(/\s+/g, " ").trim();
    const cleanInitialContent = initialContent.replace(/\s+/g, " ").trim();

    if (cleanCurrentContent === cleanInitialContent) return;

    setContent(initialContent);
    lastSavedContentRef.current = initialContent;
  }, [initialContent, isFocused, editorRef, setContent]);

  return (
    <div className="flex flex-col w-full">
      {/* Toolbar - exactly like the guide */}
      <div className="flex items-center gap-3 p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-t-md">
        {/* Text formatting buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => formatText("bold")}
            className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              activeFormats.bold
                ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                : ""
            }`}
            title="Bold (Ctrl+B)"
          >
            <FaBold size={16} />
          </button>
          <button
            type="button"
            onClick={() => formatText("italic")}
            className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              activeFormats.italic
                ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                : ""
            }`}
            title="Italic (Ctrl+I)"
          >
            <FaItalic size={16} />
          </button>
          <button
            type="button"
            onClick={() => formatText("underline")}
            className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              activeFormats.underline
                ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                : ""
            }`}
            title="Underline (Ctrl+U)"
          >
            <FaUnderline size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

        {/* Font size */}
        <div className="flex items-center gap-2">
          <select
            value={activeFormats.fontSize || ""}
            onChange={(e) => formatText("fontSize", e.target.value)}
            className="p-1.5 rounded-md text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
          >
            <option value="">Font Size</option>
            <option value="12">12px</option>
            <option value="16">16px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
          </select>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

        {/* Text alignment */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => formatText("align", "left")}
            className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              activeFormats.align === "left"
                ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                : ""
            }`}
            title="Align Left"
          >
            <FaAlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => formatText("align", "center")}
            className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              activeFormats.align === "center"
                ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                : ""
            }`}
            title="Align Center"
          >
            <FaAlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => formatText("align", "right")}
            className={`p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              activeFormats.align === "right"
                ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                : ""
            }`}
            title="Align Right"
          >
            <FaAlignRight size={16} />
          </button>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => {
              if (onBlur) onBlur();
            }}
            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors shadow-sm"
            title="Save changes"
          >
            Save
          </button>
        </div>
      </div>

      {/* Simple contentEditable editor - exactly like the guide */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={true}
          className={`min-h-[200px] p-4 focus:outline-none border border-gray-300 dark:border-gray-700 rounded-b-md ${
            isFocused ? "ring-2 ring-blue-500" : ""
          } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
          style={{
            lineHeight: "1.5",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (editorRef.current) {
              const currentContent = editorRef.current.innerHTML;
              if (currentContent !== lastSavedContentRef.current) {
                lastSavedContentRef.current = currentContent;
                if (onChange) onChange(currentContent);
              }
            }
            if (onBlur) setTimeout(() => onBlur(), 50);
          }}
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={(e) => {
            // Handle keyboard shortcuts
            if (e.ctrlKey) {
              if (e.key === "b" || e.key === "B") {
                e.preventDefault();
                formatText("bold");
                return;
              } else if (e.key === "i" || e.key === "I") {
                e.preventDefault();
                formatText("italic");
                return;
              } else if (e.key === "u" || e.key === "U") {
                e.preventDefault();
                formatText("underline");
                return;
              }
            }
            handleKeyDown(e);
          }}
        />

        {/* Placeholder */}
        {!content && !isFocused && (
          <div className="absolute top-0 left-0 pointer-events-none text-gray-500 dark:text-gray-400 p-4">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
