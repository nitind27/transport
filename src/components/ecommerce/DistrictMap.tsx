'use client'
import React, { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import Talukawisevillage from './Talukawisevillage';
import { Documents } from '../Documentsdata/documents';
import { FarmdersType } from '../farmersdata/farmers';
import { Schemecategorytype } from '../Schemecategory/Schemecategory';
import { Schemesdatas } from '../schemesdata/schemes';
import { Schemesubcategorytype } from '../Schemesubcategory/Schemesubcategory';
import { Taluka } from '../Taluka/Taluka';
import { UserCategory } from '../usercategory/userCategory';
import { Village } from '../Village/village';
import { Scheme_year } from '../Yearmaster/yearmaster';

type District = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};
interface AllFarmersData {
  users: UserCategory[];
  schemes: Schemesdatas[];
  farmers: FarmdersType[];
  schemescrud: Schemecategorytype[];
  schemessubcategory: Schemesubcategorytype[];
  yearmaster: Scheme_year[];
  documents: Documents[];
  taluka: Taluka[];
  villages: Village[];
}

type ModalSize = "small" | "medium" | "large";

const MODAL_SIZES: Record<ModalSize, string> = {
  small: "sm:max-w-lg sm:w-full",
  medium: "md:max-w-2xl md:w-full",
  large: "lg:max-w-4xl lg:w-full",
};

const districts: District[] = [
  { id: '1', name: 'Nandurbar', lat: 21.3700, lng: 74.2400 },
  { id: '2', name: 'Navapur', lat: 21.1667, lng: 73.7833 },
  { id: '3',name: 'Shahada', lat: 21.5453, lng: 74.4711 },
  { id: '4',name: 'Taloda', lat: 21.5614, lng: 74.2125 },
  { id: '5',name: 'Akkalkuwa', lat: 21.5199, lng: 74.0217 },
  { id: '6',name: 'Akrani', lat: 21.8242, lng: 74.2208 },
  { id: '7',name: 'Dhadgaon', lat: 21.8222, lng: 74.2233 }
];

type DistrictMarkerProps = {
  district: District;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  handleOpenModal: (size: ModalSize, district: District) => void;
};

const DistrictMarker: React.FC<DistrictMarkerProps> = ({
  district,
  onOpen,
  onClose,
  handleOpenModal
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        position={{ lat: district.lat, lng: district.lng }}
        title={district.name}
        clickable={true}
        onClick={onOpen}
        ref={markerRef}
      >
        <Pin
          background="#4285F4"
          borderColor="#4285F4"
          glyphColor="white"
          scale={1.4}
        />
      </AdvancedMarker>

      {marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={onClose}
          headerDisabled={true}
        >
          <div
            onClick={() => handleOpenModal("large", district)}
            style={{
              fontWeight: 600,
              color: '#4285F4',
              fontSize: '16px',
              padding: '0px 0px',
              cursor: "pointer"
            }}
          >
            {district.name}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const DistrictMap = ({ farmersData }: { farmersData: AllFarmersData }) => {

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [openSize, setOpenSize] = useState<ModalSize | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  const handleOpen = (size: ModalSize, district: District) => {
    sessionStorage.setItem('districtname', district.id);
    setOpenSize(size);
    setSelectedDistrict(district);
  };

  const handleClose = () => {
    setOpenSize(null);

    setSelectedDistrict(null);
  };

  const renderModal = (size: ModalSize) => (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 "
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-${size}-label`}
      tabIndex={-1}
    >
      <div
        className={`bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-2xs rounded-xl w-full m-3 mx-auto transition-all ${MODAL_SIZES[size]} `}
      >
        <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
          <h3 id={`modal-${size}-label`} className="font-bold text-gray-800 dark:text-white">
            {selectedDistrict?.name || 'Modal Title'}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="size-8 inline-flex justify-center items-center rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <p className="mt-1 text-gray-800 dark:text-neutral-400">

            <Talukawisevillage farmersData={farmersData}/>
          </p>
        </div>
        <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t border-gray-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={handleClose}
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
          >
            Close
          </button>
          
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      {openSize && renderModal(openSize)}
      <APIProvider apiKey="AIzaSyBDR0JbLRuagtWQgA2bpRUTprisPetZ1wA">
        <Map
          mapId="districts-map"
          defaultCenter={{ lat: 21.5, lng: 74.2 }}
          defaultZoom={10}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {districts.map((district, idx) => (
            <DistrictMarker
              key={idx}
              district={district}
              open={openIndex === idx}
              onOpen={() => setOpenIndex(idx)}
              onClose={() => setOpenIndex(null)}
              handleOpenModal={handleOpen}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
};

export default DistrictMap;
