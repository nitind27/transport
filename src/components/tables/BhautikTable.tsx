"use client";

import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Column, FilterOption } from "./tabletype";
// import FormInModal from "../example/ModalExample/FormInModal";
import BhautikModal from "../example/ModalExample/BhautikModal";

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  filterOptions?: FilterOption[];
  filterKey?: keyof T;
  inputfiled?: React.ReactNode;
  submitbutton?: React.ReactNode;
  title?: string;
  searchKey?: string;
  classname?: string;
};

export function BhautikTable<T extends object>({
  data,
  columns,
  filterOptions = [],
  filterKey,
  classname,
  title,
  submitbutton,
  inputfiled,
}: Props<T>) {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Make sure to include perPage and currentPage in the dependency array!
  const reactColumns = useMemo(() => {
    return [
      {
        name: "SR No.",
        cell: (_row: T, index: number) => (perPage * (currentPage - 1)) + index + 1,
        width: "80px",
      },
      ...columns.map((col) => ({
        name: col.label,
        selector: (row: T) =>
          col.accessor ? String(row[col.accessor] ?? "") : "",
        cell: col.render
          ? (row: T) => col.render?.(row)
          : (row: T) => (col.accessor ? String(row[col.accessor]) : ""),
        sortable: true,
      })),
    ];
  }, [columns, perPage, currentPage]); // <-- Add perPage and currentPage here

  const filteredData = useMemo(() => {
    let tempData = [...data];

    // Filter by dropdown value
    if (filter && filterKey) {
      tempData = tempData.filter(
        (row) => String(row[filterKey]) === String(filter)
      );
    }

    // Global search across all keys
    if (search) {
      tempData = tempData.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return tempData;
  }, [data, filter, filterKey, search]);

  const SubHeaderComponent = (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-2 flex-1">
        {filterOptions.length > 0 && filterKey && (
          <select
            className="border rounded px-3 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All</option>
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          placeholder="Search..."
          className="rounded border border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow md:w-auto flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="w-full md:w-auto">
        <BhautikModal
          inputfiled={inputfiled}
          title={title}
          submitbutton={submitbutton}
          classname={classname}
        />
      </div>
    </div>
  );

  return (
   <div className="bg-white rounded-2xl shadow-md  border p-4">
      <DataTable
        columns={reactColumns}
        data={filteredData}
        pagination
        paginationPerPage={perPage}
        paginationDefaultPage={currentPage}
        onChangePage={page => setCurrentPage(page)}
        onChangeRowsPerPage={newPerPage => {
          setPerPage(newPerPage);
          setCurrentPage(1); // Reset to first page when page size changes
        }}
        highlightOnHover
        responsive
        striped
        persistTableHead
        subHeader
        subHeaderComponent={SubHeaderComponent}
        customStyles={{
          rows: {
            style: {
              minHeight: "48px",
            },
          },
          headCells: {
            style: {
              fontWeight: "600",
              fontSize: "14px",
              border: "1px solid #ddd", // Add border to header cells
            },
          },
          cells: {
            style: {
              border: "1px solid #ddd", // Add border to body cells
            },
          },
        }}
      />
    </div>
  );
}
