"use client";

import { useState } from 'react';

import DispatchView from './DispatchView';
import PendingOrderDetails from './PendingOrderDetails';
import Routepaperview from '../Routepaperview/Routepaperview';
import SalesTab from './SalesTab';

const DispatchTabs = () => {
  const [activeTab, setActiveTab] = useState<'view' | 'pending' | 'routepaperview' | 'salesreturn' | 'viewsalesreturn'>('pending');

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex gap-3">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Order Details
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm ${
              activeTab === 'view'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            View Dispatch Details
          </button>
          <button
            onClick={() => setActiveTab('routepaperview')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm ${
              activeTab === 'routepaperview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            View Route Paper
          </button>
          <button
            onClick={() => setActiveTab('salesreturn')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg shadow-sm ${
              activeTab === 'salesreturn' || activeTab === 'viewsalesreturn'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Sales Return
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'view' && <DispatchView />}
        {activeTab === 'pending' && <PendingOrderDetails />}
        {activeTab === 'routepaperview' && <Routepaperview />}
        {(activeTab === 'salesreturn' || activeTab === 'viewsalesreturn') && <SalesTab />}
      </div>
    </div>
  );
};

export default DispatchTabs;