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
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            variants={modalBackdropVariants}
            onClick={() => {
              if (!loading) onClose();
            }}
          />

          <motion.div
            className="brand-glass-strong relative w-full max-w-md overflow-hidden rounded-2xl border border-emerald-100 p-6 shadow-2xl shadow-emerald-900/10"
            variants={modalContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-r from-emerald-100/50 via-teal-100/35 to-transparent" />

            <motion.h3
              className="relative mb-2 text-lg font-bold text-gray-900"
              variants={modalItemVariants}
            >
              {title}
            </motion.h3>

            <motion.p
              className="relative mb-6 rounded-xl border border-emerald-100/70 bg-white/65 px-3 py-2 text-sm text-gray-600"
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
                className="rounded-lg border border-emerald-100 bg-white/75 px-4 py-2 text-gray-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
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
