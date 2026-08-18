import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon as Search, XMarkIcon as X } from '@heroicons/react/24/outline';

interface Employee {
  id: number;
  name: string;
  employee_code?: string;
  department?: { name: string };
  position?: string;
}

interface EmployeeSearchSelectProps {
  employees: Employee[];
  value: number | null;
  onChange: (employeeId: number | null) => void;
  placeholder?: string;
  className?: string;
}

export const EmployeeSearchSelect: React.FC<EmployeeSearchSelectProps> = ({
  employees,
  value,
  onChange,
  placeholder,
  className = ''
}) => {
  const resolvedPlaceholder = placeholder ?? 'ស្វែងរកបុគ្គលិកតាមឈ្មោះ ឬលេខកូដ...';
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find selected employee on mount or when value changes
  useEffect(() => {
    if (value) {
      const employee = employees.find(emp => emp.id === value);
      setSelectedEmployee(employee || null);
      setSearchTerm(employee ? `${employee.employee_code} - ${employee.name}` : '');
    } else {
      setSelectedEmployee(null);
      setSearchTerm('');
    }
  }, [value, employees]);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp => {
    const search = searchTerm.toLowerCase();
    return (
      (emp.name || '').toLowerCase().includes(search) ||
      (emp.employee_code || '').toLowerCase().includes(search) ||
      (emp.department?.name || '').toLowerCase().includes(search) ||
      (emp.position || '').toLowerCase().includes(search)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm(`${employee.employee_code} - ${employee.name}`);
    onChange(employee.id);
    setShowDropdown(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmployee(null);
    setSearchTerm('');
    onChange(null);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSelectedEmployee(null);
      onChange(null);
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={resolvedPlaceholder}
          className="w-full pl-10 pr-10 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {selectedEmployee && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && filteredEmployees.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredEmployees.map((employee) => (
            <button
              key={employee.id}
              type="button"
              onClick={() => handleSelect(employee)}
              className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0 ${
                selectedEmployee?.id === employee.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {employee.employee_code} - {employee.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {employee.position && <span>{employee.position}</span>}
                    {employee.position && employee.department?.name && <span> • </span>}
                    {employee.department?.name && <span>{employee.department.name}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && searchTerm && filteredEmployees.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
          {'រកមិនឃើញបុគ្គលិកទេ'}
        </div>
      )}
    </div>
  );
};
