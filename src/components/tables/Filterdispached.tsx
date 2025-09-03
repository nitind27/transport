"use client";

import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Column, FilterOption } from "./tabletype";

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  filterOptions?: FilterOption[];
  filterKey?: keyof T;
  searchKey?: string;
  classname?: string;
  toolbar?: React.ReactNode; // inline filters + actions
};

export function Filterdispached<T extends Record<string, unknown>>({
  data,
  columns,
  filterKey,
  toolbar,
}: Props<T>) {
  const [filter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const toStringVal = (v: unknown) => String(v ?? "");

  const reactColumns = useMemo(() => {
    return [
      {
        name: "SR No.",
        cell: (_row: T, index: number) => perPage * (currentPage - 1) + index + 1,
        width: "80px",
      },
      ...columns.map((col) => ({
        name: col.label,
        selector: (row: T) =>
          col.accessor ? toStringVal(row[col.accessor]) : "",
        cell: col.render
          ? (row: T) => col.render?.(row)
          : (row: T) => (col.accessor ? toStringVal(row[col.accessor]) : ""),
        sortable: true,
      })),
    ];
  }, [columns, perPage, currentPage]);

  const filteredData = useMemo(() => {
    let tempData = [...data];

    if (filter && filterKey) {
      tempData = tempData.filter(
        (row) => String(row[filterKey]) === String(filter)
      );
    }

    if (search) {
      tempData = tempData.filter((row) =>
        Object.values(row).some((value) =>
          toStringVal(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return tempData;
  }, [data, filter, filterKey, search]);

  const SubHeaderComponent = (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="text"
        placeholder="Search..."
        className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm flex-1 min-w-[200px]"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        {toolbar}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-md border p-4">
      <DataTable
        columns={reactColumns}
        data={filteredData}
        pagination
        paginationPerPage={perPage}
        paginationDefaultPage={currentPage}
        onChangePage={(page) => setCurrentPage(page)}
        onChangeRowsPerPage={(newPerPage) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
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
              border: "1px solid #ddd",
            },
          },
          cells: {
            style: {
              border: "1px solid #ddd",
            },
          },
        }}
      />
    </div>
  );
}