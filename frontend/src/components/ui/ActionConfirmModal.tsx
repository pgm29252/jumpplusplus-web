"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  modalBackdropVariants,
  modalContainerVariants,
  modalItemVariants,
} from "./modalMotion";

interface ActionConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ActionConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  danger = false,
  onConfirm,
  onClose,
}: ActionConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm"
            variants={modalBackdropVariants}
            onClick={() => {
              if (!loading) onClose();
            }}
          />

          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
            variants={modalContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.h3
              className="mb-2 text-lg font-bold text-gray-900"
              variants={modalItemVariants}
            >
              {title}
            </motion.h3>

            <motion.p
              className="mb-6 text-sm text-gray-600"
              variants={modalItemVariants}
            >
              {description}
            </motion.p>

            <motion.div
              className="flex justify-end gap-3"
              variants={modalItemVariants}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`rounded-lg px-4 py-2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {loading ? "Processing..." : confirmLabel}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
