import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AudioRecordModal({ closeModal }) {
  const [close, setcloseModal] = useState(false);

  function handleModalClose() {
    setcloseModal(!close);
  }

  useEffect(() => {
    closeModal(close);
  }, [closeModal, close]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleModalClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 999,
      }}
    >
      <motion.div
        initial={{ y: "-100vh" }}
        animate={{ y: 0 }}
        exit={{ y: "-100vh" }}
        style={{
          position: "relative",
          width: "90%",
          maxWidth: "500px",
          height: "auto",
          backgroundColor: "#fff",
          borderRadius: "10px",
          padding: "2rem",
        }}
        transition={{
          duration: 0.7,
          ease: "backInOut",
          type: "spring",
          stiffness: 75,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Your audio recording component goes here */}
        <p>Audio recording component</p>
      </motion.div>
    </motion.div>
  );
}
