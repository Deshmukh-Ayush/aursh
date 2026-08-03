"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

type ProjectOverviewStaggerProps = {
  children: React.ReactNode;
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      duration: 0.4,
      bounce: 0,
    },
  },
};

export function ProjectOverviewStagger({ children }: ProjectOverviewStaggerProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {React.Children.map(children, (child) => (
        <motion.div variants={item}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
