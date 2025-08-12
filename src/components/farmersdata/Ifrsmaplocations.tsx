"use client";

import React, { useState } from 'react';
import { BsGeoAltFill } from "react-icons/bs";
import Ifrsmapshow from './Ifrsmapshow';
import { useJsApiLoader } from '@react-google-maps/api';

interface Coordinate {
    lat: number;
    lng: number;
}

interface IfrsmaplocationsProps {
    coordinates: Coordinate[];
}

const Ifrsmaplocations: React.FC<IfrsmaplocationsProps> = ({ coordinates }) => {
    const [showMap, setShowMap] = useState(false);
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ['geometry'],
    });
    if (!isLoaded) return <div>Loading...</div>;

    
    return (
        <div>
            <span
                className="text-green-700 cursor-pointer hover:scale-110 inline-block"
                onClick={() => setShowMap(true)}
            >
                <BsGeoAltFill size={24} />
            </span>

            {showMap && (

                <div className="fixed inset-0 z-999999 bg-white">
                    <Ifrsmapshow coordinates={coordinates} onClose={() => setShowMap(false)} />
                </div>
            )}
        </div>
    );
};

export default Ifrsmaplocations;
