import React, { useState, FC } from "react";

type ModalSize = "small" | "medium" | "large";

const MODAL_SIZES: Record<ModalSize, string> = {
  small: "sm:max-w-lg sm:w-full",
  medium: "md:max-w-2xl md:w-full",
  large: "lg:max-w-4xl lg:w-full",
};

const MultiSizeModal: FC = () => {
  const [openSize, setOpenSize] = useState<ModalSize | null>(null);

  const handleOpen = (size: ModalSize) => setOpenSize(size);
  const handleClose = () => setOpenSize(null);

  const renderModal = (size: ModalSize) => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-${size}-label`}
      tabIndex={-1}
    >
      <div
        className={`bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-2xs rounded-xl w-full m-3 mx-auto transition-all ${MODAL_SIZES[size]}`}
      >
        <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
          <h3
            id={`modal-${size}-label`}
            className="font-bold text-gray-800 dark:text-white"
          >
            Modal title
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="size-8 inline-flex justify-center items-center rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <p className="mt-1 text-gray-800 dark:text-neutral-400">
            This is a wider card with supporting text below as a natural lead-in to additional content.
          </p>
        </div>
        <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleClose}
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
          >
            Close
          </button>
          <button
            type="button"
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 flex gap-4">
      {/* <button
        type="button"
        className="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => handleOpen("small")}
      >
        Small
      </button>
      <button
        type="button"
        className="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => handleOpen("medium")}
      >
        Medium
      </button> */}
      <button
        type="button"
        className="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => handleOpen("large")}
      >
        Large
      </button>

      {/* Render the modal if open */}
      {openSize && renderModal(openSize)}
    </div>
  );
};

export default MultiSizeModal;
