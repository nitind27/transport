// components/Loader.js
"use client";
import React from "react";

const Loader = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-[9999] bg-white/75 dark:bg-gray-900/70 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>

    </div>
  );
};

export default Loader;
