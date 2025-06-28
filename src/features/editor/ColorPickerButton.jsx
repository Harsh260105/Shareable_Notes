import React, { useRef } from "react";

const ColorPickerButton = ({
  activeColor,
  disabled,
  onColorChange,
  onBeforeColorChange,
}) => {
  const colorInputRef = useRef(null);

  const handleButtonClick = (e) => {
    e.preventDefault();
    // Save selection before opening color picker
    if (onBeforeColorChange) {
      onBeforeColorChange();
    }
    // Directly trigger the native color picker
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  return (
    <div className="color-picker-button">
      <button
        type="button"
        className={`rte-btn ${activeColor ? "active" : ""} ${
          disabled ? "disabled" : ""
        }`}
        onClick={handleButtonClick}
        onMouseDown={(e) => e.preventDefault()}
        title="Text Color"
        disabled={disabled}
        aria-pressed={!!activeColor}
      >
        <span style={{ color: activeColor || "currentColor" }}>A</span>
      </button>
      <input
        ref={colorInputRef}
        type="color"
        value={activeColor || "#000000"}
        onChange={onColorChange}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          padding: 0,
          margin: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default ColorPickerButton;
