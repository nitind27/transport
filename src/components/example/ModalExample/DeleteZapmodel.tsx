import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface DefaultModalProps {
  id: number;
  fetchData: () => void;
  endpoint: string;
  bodyname: string;
  newstatus: string;
}

export default function DeleteZapmodel({ id, fetchData, endpoint, bodyname, newstatus }: DefaultModalProps) {
  const { isOpen, openModal, closeModal } = useModal();

  const handleStatusChange = async () => {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyname]: id, status: newstatus === "Active" ? "Inactive" : "Active" }),
      });

      if (response.ok) {
        toast.success(`Status updated successfully`);
        fetchData();
        closeModal();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An error occurred while updating status.");
    }
  };

  return (
    <div>
      <span
        onClick={openModal}
        className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
      >
        {newstatus === "Active" ? <FaEye className="inline-block align-middle text-lg" /> : <FaEyeSlash className="inline-block align-middle text-lg" />}
      </span>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <h4 className="font-semibold text-gray-800 mb-7 text-title-sm dark:text-white/90">
          Confirmation
        </h4>
        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          Are you sure you want to change the status?
        </p>

        <div className="flex items-center justify-end w-full gap-3 mt-8">
          <Button size="sm" variant="outline" onClick={closeModal}>
            Close
          </Button>
          <Button size="sm" onClick={handleStatusChange}>
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
