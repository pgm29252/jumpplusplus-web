"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ToastNoticeProps {
  open: boolean;
  message: string;
  tone?: "success" | "error";
}

export default function ToastNotice({
  open,
  message,
  tone = "success",
}: ToastNoticeProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed bottom-5 right-5 z-[60]"
        >
          <div
            className={`rounded-xl border px-3 py-2 text-sm font-medium shadow-lg ${
              tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
