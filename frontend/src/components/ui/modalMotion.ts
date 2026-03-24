import type { Variants } from "framer-motion";

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.14, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: "easeIn" } },
};

export const modalContainerVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 520,
      damping: 34,
      mass: 0.65,
      when: "beforeChildren",
      staggerChildren: 0.035,
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.985,
    transition: { duration: 0.12, ease: "easeOut" },
  },
};

export const modalItemVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.14, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 3,
    transition: { duration: 0.08, ease: "easeIn" },
  },
};