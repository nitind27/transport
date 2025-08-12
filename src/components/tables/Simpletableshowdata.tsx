"use client";

import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";

type FilterOption = {
  label: string;
  value: string;
};

type FilterGroup = {
  label: string;
  options: FilterOption[];
  value?:string;
  onChange?: (value: string) => void;
};

type Column<T> = {
  key: string;
  label: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  filterOptions?: FilterGroup[];
  inputfiled?: React.ReactNode;
  submitbutton?: React.ReactNode;
  title?: string;
  searchKey?: string;
  classname?: string;
};

export function Simpletableshowdata<T extends object>({
  data,
  columns,
  filterOptions = [],
  searchKey,
  inputfiled,
  submitbutton,
  classname,
}: Props<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

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
        sortable: col.sortable !== false,
        width: col.width,
      })),
    ];
  }, [columns, perPage, currentPage]);

  const filteredData = useMemo(() => {
    let tempData = [...data];

    // Apply multiple filters
    if (filterOptions.length > 0) {
      tempData = tempData.filter((row) => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          return String(row[key as keyof T]) === String(value);
        });
      });
    }

    // Column-specific search
    if (search && searchKey) {
      tempData = tempData.filter((row) =>
        String(row[searchKey as keyof T])
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }
    // Global search
    else if (search) {
      tempData = tempData.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return tempData;
  }, [data, filters, search, searchKey, filterOptions]);

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const SubHeaderComponent = (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-col md:flex-row gap-2 flex-1">
          {filterOptions.map((group, index) => (
            <select
              key={`${group.label}-${index}`}
              className="border rounded px-3 py-2 min-w-[150px]"
              value={group.value || ""}
              onChange={(e) => {
                group.onChange?.(e.target.value);
                handleFilterChange(group.label, e.target.value);
              }}
            >
              <option value="">All {group.label}</option>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          <input
            type="text"
            placeholder="Search..."
            className="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow md:w-auto flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {submitbutton && (
          <div className="flex items-center">
            {submitbutton}
          </div>
        )}
      </div>

      {inputfiled && (
        <div className="mt-4">
          {inputfiled}
        </div>
      )}
    </div>
  );

  return (
    <div className={`p-4 rounded-lg border ${classname}`}>
      <DataTable
        columns={reactColumns}
        data={filteredData}
        pagination
        highlightOnHover
        responsive
        striped
        persistTableHead
        subHeader
        subHeaderComponent={SubHeaderComponent}
        paginationPerPage={perPage}
        paginationDefaultPage={currentPage}
        onChangePage={page => setCurrentPage(page)}
        onChangeRowsPerPage={newPerPage => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
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
