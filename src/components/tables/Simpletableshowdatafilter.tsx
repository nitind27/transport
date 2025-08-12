"use client"
import React, { useState, useMemo } from "react";
import { Column, FilterOption } from "./tabletype";

type ServerSidePagination = {
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  filterOptions?: FilterOption[];
  filterKey?: keyof T;
  inputfiled?: React.ReactNode;
  submitbutton?: React.ReactNode;
  title?: string;
  searchKey?: keyof T;
  classname?: string;
  rowsPerPage?: number;
  serverSidePagination?: ServerSidePagination;
};

export function Simpletableshowdatafilter<T extends object>({
  data,
  columns,
  filterOptions = [],
  filterKey,
  searchKey,

  rowsPerPage = 5,
  serverSidePagination,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  // Client-side filtering for local search
  const filteredData = useMemo(() => {
    if (serverSidePagination) return data; // Don't filter if using server-side
    
    let d = [...data];
    if (filter && filterKey) {
      d = d.filter((row) => String(row[filterKey]) === filter);
    }
    if (search && searchKey) {
      d = d.filter((row) =>
        String(row[searchKey]).toLowerCase().includes(search.toLowerCase())
      );
    }
    return d;
  }, [data, filter, filterKey, search, searchKey, serverSidePagination]);

  // Pagination calculations
  const currentPage = serverSidePagination?.currentPage || page;
  const totalItems = serverSidePagination?.total || filteredData.length;
  const totalPages = serverSidePagination?.totalPages || Math.ceil(filteredData.length / rowsPerPage);
  
  const paginatedData = serverSidePagination 
    ? data 
    : filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      );

  const handlePageChange = (newPage: number) => {
    if (serverSidePagination) {
      serverSidePagination.onPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };

  React.useEffect(() => {
    if (!serverSidePagination) {
      setPage(1);
    }
  }, [filter, search, serverSidePagination]);

  return (
    <div className="p-4 bg-white rounded-lg w-full  mx-auto border">
      {/* Filter/Search Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2 flex-1">
          {filterOptions.length > 0 && filterKey && (
            <select
              className="border rounded-lg px-3 py-2 w-full md:w-auto"
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

          {searchKey && (
            <input
              type="text"
              placeholder="Search..."
          className="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow md:w-auto flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">SR No.</th>
              {columns.map((col) => (
                <th 
                  key={String(col.key)} 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + 1} 
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {(currentPage - 1) * rowsPerPage + idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td 
                      key={`${String(col.key)}-${idx}`}
                      className="px-4 py-3 text-sm text-gray-700"
                    >
                      {col.render
                        ? col.render(row)
                        : col.accessor
                          ? String(row[col.accessor])
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * rowsPerPage + 1} - 
          {Math.min(currentPage * rowsPerPage, totalItems)} of {totalItems}
        </div>
        
        <div className="flex gap-2 whitespace-nowrap w-full">
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
