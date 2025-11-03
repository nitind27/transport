"use client";

import { useState } from 'react';

import CellsReturn from './CellsReturn';
import Salesview from './Salesview';

const SalesTab = () => {
  const [activeTab, setActiveTab] = useState<'salesreturn' | 'viewsalesreturn'>('salesreturn');

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex gap-3">
          <button
            onClick={() => setActiveTab('salesreturn')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm ${
              activeTab === 'salesreturn'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Sales Return
          </button>
          <button
            onClick={() => setActiveTab('viewsalesreturn')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm ${
              activeTab === 'viewsalesreturn'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            View Sales Return
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'salesreturn' && <CellsReturn />}
        {activeTab === 'viewsalesreturn' && <Salesview />}
      </div>
    </div>
  );
};

export default SalesTab;
