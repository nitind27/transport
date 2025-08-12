// components/ReusableModal.tsx
'use client'
import React from 'react';

type FieldConfig = {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  label: string;
  options?: { value: string; label: string }[];
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig[];
  onSubmit: (data: { [key: string]: string | number }) => void;
  initialData?: { [key: string]: string | number };
  filters?: FieldConfig[];
  onFilterChange?: (filters: { [key: string]: string | number }) => void;
};

const CustomModel: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  fields,
  onSubmit,
  initialData = {},
  filters = [],
  onFilterChange,
}) => {
  const [formData, setFormData] = React.useState<{ [key: string]: string | number }>(initialData);
  const [filterValues, setFilterValues] = React.useState<{ [key: string]: string | number }>({});

//   React.useEffect(() => {
//     setFormData(initialData);
//   }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filterValues, [name]: value };
    setFilterValues(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="">
      <div className="bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            ✕  
          </button>
        </div>

        {/* Filter Section */}
        {filters.length > 0 && (
          <div className="p-4 border-b">
            <h3 className="mb-4 text-lg font-medium">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filters.map((filter) => (
                <div key={filter.name}>
                  <label className="block text-sm font-medium mb-1">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      name={filter.name}
                      onChange={handleFilterChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select {filter.label}</option>
                      {filter.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={filter.type}
                      name={filter.name}
                      onChange={handleFilterChange}
                      className="w-full p-2 border rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name]?.toString() || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]?.toString() || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomModel;
