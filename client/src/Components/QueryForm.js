import react, { useState } from "react";
import { MdMicNone } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

import "../Stylesheets/QueryForm.css";

export default function QueryForm({ returnTravelInfo }) {
  const [query, setquery] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const response = await fetch("http://localhost:3000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: query }),
    });

    response.json().then((data) => {
      returnTravelInfo(data.result);
      setquery("");
    });
  }

  return (
    <motion.form key="queryForm" onSubmit={handleSubmit}>
      <motion.label
        id="queryBoxLabel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          type: "spring",
          delay: 1.5,
          duration: 1.5,
          stiffness: 25,
          damping: 9,
        }}
      >
        <motion.span
          style={{
            position: "absolute",
            marginInline: "auto",
            zIndex: -1,
          }}
        >
          How can I help?
        </motion.span>
        <motion.span style={{ display: "flex", marginInlineEnd: 10 }}>
          <MdMicNone />
        </motion.span>
      </motion.label>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          type: "spring",
          delay: 0.5,
          duration: 1,
          stiffness: 25,
          damping: 9,
        }}
      >
        <textarea
          rows="15"
          cols="80"
          type="text"
          value={query}
          onChange={(event) => setquery(event.target.value)}
        />
        <div id="submitBtnContainer">
          <motion.input
            whileTap={{
              scale: 0.9,
            }}
            type="submit"
            value="Submit"
            id="submitBtn"
          />
        </div>
      </motion.div>
    </motion.form>
  );
}
