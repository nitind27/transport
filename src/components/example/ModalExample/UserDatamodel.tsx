"use client";

import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { FarmdersType } from "@/components/farmersdata/farmers";
import { Taluka } from "@/components/Taluka/Taluka";
import { Village } from "@/components/Village/village";

interface DefaultModalProps {
  farmersid: string;
  farmername: string;
  datafarmers: FarmdersType[];
  datavillage: Village[];
  datataluka: Taluka[];
}

export default function UserDatamodel({ farmersid, datafarmers, farmername, datavillage, datataluka }: DefaultModalProps) {
  const { isOpen, openModal, closeModal } = useModal();

  const farmer = datafarmers.find((data) => data.farmer_id === Number(farmersid));

  // Fields to exclude
  const excludedFields = ["farmer_id", "created_at", "updated_at", "schemes", "kisan_id", "documents"];


  const getvillage = (id: string) => {
    const subcategory = datavillage.find(sub => sub.taluka_id == id);
    return subcategory?.name || id.toString();
  };

  const gettaluka = (id: number) => {
    const subcategory = datataluka.find(sub => sub.taluka_id == id);
    return subcategory?.name || id.toString();
  };

  return (
    <div>
      <span className="cursor-pointer hover:text-blue-700 underline" onClick={openModal}>
        {farmername}
      </span>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <h4 className="font-semibold text-gray-800 mb-4 text-xl dark:text-white">
          IFR holder
        </h4>

        {farmer ? (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="min-w-full border text-left text-sm ">
              <thead>
                <tr>
                  <th className="px-4 py-2 border border-gray-300 font-semibold text-gray-700 dark:text-white">Sr.No</th>
                  <th className="px-4 py-2 border border-gray-300 font-semibold text-gray-700 dark:text-white">Field</th>
                  <th className="px-4 py-2 border border-gray-300 font-semibold text-gray-700 dark:text-white">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(farmer)
                  .filter(([key]) => !excludedFields.includes(key))
                  .map(([key, value], index) => {
                    let displayValue: React.ReactNode = value || "-";

                    if (key == "taluka_id") {
                      displayValue = gettaluka(value);
                    }
                    if (key == "village_id") {
                      displayValue = getvillage(value);
                    }
                    return (


                      <tr key={key}>
                        <td className="px-4 py-2 border border-gray-300 capitalize font-medium text-gray-700 dark:text-white">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 border border-gray-300 capitalize font-medium text-gray-700 dark:text-white">
                          {key === "adivasi"
                            ? "Type"
                            : key === "village_id"
                              ? "Village"
                              : key === "taluka_id"
                                ? "Taluka"
                                : key.replace(/_/g, " ")}

                        </td>
                        <td className="px-4 py-2 border border-gray-300 text-gray-600 dark:text-gray-300">
                          {displayValue}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No data found for this farmer.
          </p>
        )}

        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <Button size="sm" variant="outline" onClick={closeModal}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
