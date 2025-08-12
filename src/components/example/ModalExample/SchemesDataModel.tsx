"use client";

import React from "react";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import { useModal } from "@/hooks/useModal";

import { Schemesdatas } from "@/components/schemesdata/schemes";
import { Schemecategorytype } from "@/components/Schemecategory/Schemecategory";
import { Schemesubcategorytype } from "@/components/Schemesubcategory/Schemesubcategory";

import { Scheme_year } from "@/components/Yearmaster/yearmaster";
import { Documents } from "@/components/Documentsdata/documents";

interface DefaultModalProps {
    schemeid: number;
    farmername: string;
    datascheme: Schemesdatas[];
    schemescrud: Schemecategorytype[];
    schemessubcategory: Schemesubcategorytype[];
    dataschemsyear: Scheme_year[];
    datadocuments: Documents[];
}

export default function SchemesDataModel({ schemeid, datascheme, farmername, schemescrud, schemessubcategory, dataschemsyear, datadocuments }: DefaultModalProps) {
    const { isOpen, openModal, closeModal } = useModal();

    const farmer = datascheme.find((data) => data.scheme_id === Number(schemeid));

    // Fields to exclude
    const excludedFields = ["scheme_id", "created_at", "updated_at", "category_name", 'sub_category_name', "scheme_year"];

    const getCategoryName = (id: number) => {
        const category = schemescrud.find(cat => cat.scheme_category_id == id);

        return category?.name || id.toString();
    };

    const getSubcategoryName = (id: number) => {
        const subcategory = schemessubcategory.find(sub => sub.scheme_sub_category_id == id);
        return subcategory?.name || id.toString();
    };

    const getSchemeyear = (id: number) => {
        const subcategory = dataschemsyear.find(sub => sub.scheme_year_id == id);
        return subcategory?.year || id.toString();
    };
    const getDocuments = (docValue: string | number) => {
        if (typeof docValue === "string" && docValue.includes(",")) {
            const ids = docValue.split(",").map(id => Number(id.trim()));
            const documentNames = ids.map(id => {
                const doc = datadocuments.find(sub => sub.id === id);
                return doc?.document_name || id.toString();
            });
            return documentNames.join(", ");
        } else {
            const id = typeof docValue === "string" ? Number(docValue) : docValue;
            const doc = datadocuments.find(sub => sub.id === id);
            return doc?.document_name || id.toString();
        }
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
                    Scheme Info
                </h4>

                {farmer ? (
                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="min-w-full border border-gray-300 border-collapse text-left text-sm">
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

                                        if (key === "scheme_year_id") {
                                            displayValue = getSchemeyear(value);
                                        } else if (key === "scheme_category_id") {
                                            displayValue = getCategoryName(value);
                                        } else if (key === "scheme_sub_category_id") {
                                            displayValue = getSubcategoryName(value);
                                        } else if (key === "documents") {
                                            displayValue = getDocuments(value);
                                        }

                                        return (
                                            <tr key={key}>
                                                <td className="px-4 py-2 border border-gray-300 capitalize font-medium text-gray-700 dark:text-white">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-2 border border-gray-300 capitalize font-medium text-gray-700 dark:text-white">
                                                    {key === "scheme_category_id"
                                                        ? "Scheme Category"
                                                        : key === "scheme_sub_category_id"
                                                            ? "Scheme Sub Category"
                                                            : key === "scheme_year_id"
                                                                ? "Scheme Year"
                                                                : key.replace(/_/g, " ")}
                                                </td>
                                                <td className="px-4 py-2 border border-gray-300 text-gray-600 dark:text-gray-300">
                                                    {displayValue}
                                                </td>
                                            </tr>
                                        );
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
