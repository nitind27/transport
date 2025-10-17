"use client";

import { useState } from 'react';
import Dipatchdetials from './Dipatchdetials';
import DispatchView from './DispatchView';
import PendingOrderDetails from './PendingOrderDetails';
import Routepaperview from '../Routepaperview/Routepaperview';
import CellsReturn from './CellsReturn';

const DispatchTabs = () => {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'view' | 'pending' | 'routepaperview' | 'cellsreturn'>('dispatch');

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dispatch'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dispatch Details
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Order Details
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'view'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            View Dispatch Details
          </button>
          
          <button
            onClick={() => setActiveTab('routepaperview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'routepaperview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            View Route Paper
          </button>
          <button
            onClick={() => setActiveTab('cellsreturn')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cellsreturn'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sales return
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'dispatch' && <Dipatchdetials />}
        {activeTab === 'view' && <DispatchView />}
        {activeTab === 'pending' && <PendingOrderDetails />}
        {activeTab === 'routepaperview' && <Routepaperview />}
        {activeTab === 'cellsreturn' && <CellsReturn />}
      </div>
    </div>
  );
};

export default DispatchTabs;