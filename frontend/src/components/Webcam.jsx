import { useEffect, useRef } from "react";
import WebcamLib from "react-webcam";

function Webcam({ onCapture, warningLevel }) {
  const webcamRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) onCapture(imageSrc);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [onCapture]);

  // 🔥 BORDER COLOR LOGIC (FIXED)
  const isCritical =
    warningLevel === "FINAL_WARNING" ||
    warningLevel === "PHONE_DETECTED";

  const borderColor = isCritical
    ? "#dc2626"
    : warningLevel
    ? "#f59e0b"
    : "#22c55e";

  return (
    <div
      style={{
        padding: 6,
        borderRadius: 18,
        background: "#020617",
        border: `3px solid ${borderColor}`,
        transition: "border 0.3s ease",
        boxShadow: "0 12px 35px rgba(0,0,0,0.35)",
        animation: isCritical ? "pulse 1.2s infinite" : "none"
      }}
    >
      <div style={styles.videoWrapper}>
        <WebcamLib
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          style={styles.video}
        />
      </div>

      {/* 🔥 Pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); }
            70% { box-shadow: 0 0 0 12px rgba(220,38,38,0); }
            100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  videoWrapper: {
    width: "100%",
    aspectRatio: "4 / 3",   // ✅ stable ratio
    borderRadius: 14,
    overflow: "hidden",     // ✅ no edge cutting
    background: "#000"
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover"      // ✅ no stretch
  }
};

export default Webcam;
