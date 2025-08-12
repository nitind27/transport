'use client';

import React, { useEffect, useState } from 'react';
import {
    GoogleMap,
    Marker,
    Polygon,
    useJsApiLoader,
} from '@react-google-maps/api';
import { IoClose } from 'react-icons/io5';

interface Coordinate {
    lat: number;
    lng: number;
}

interface IfrsmapshowProps {
    coordinates: Coordinate[];
    onClose: () => void;
}

const containerStyle = {
    width: '100vw',
    height: '100vh',
};

const polygonOptions = {
    fillColor: '#FF0000',
    fillOpacity: 0.3,
    strokeColor: '#FF0000',
    strokeOpacity: 1,
    strokeWeight: 2,
    clickable: false,
    editable: false,
    draggable: false,
};

const Ifrsmapshow: React.FC<IfrsmapshowProps> = ({ coordinates, onClose }) => {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['geometry'],
    });

    const [areaSqM, setAreaSqM] = useState(0);
    const [areaHectares, setAreaHectares] = useState(0);
    const [areaAcres, setAreaAcres] = useState(0);
    const [areaBigha, setAreaBigha] = useState(0);
    // Calculate center of polygon
    const center = coordinates.length > 0
        ? {
            lat: coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length,
            lng: coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length,
        }
        : { lat: 20.5937, lng: 78.9629 }; // fallback to India

useEffect(() => {
  if (isLoaded && coordinates.length >= 3) {
    setTimeout(() => {
      if (
        typeof window !== 'undefined' &&
        window.google?.maps?.geometry?.spherical
      ) {
        const path = coordinates.map(coord => new window.google.maps.LatLng(coord.lat, coord.lng));
        const area = window.google.maps.geometry.spherical.computeArea(path);

        setAreaSqM(area);
        setAreaHectares(area / 10000);
        setAreaAcres(area / 4046.86);
        setAreaBigha(area / 2508.38);
      }
    }, 10);
  }
}, [isLoaded, JSON.stringify(coordinates)]);


    if (!isLoaded) return <div>Loading map...</div>;

    return (
        <div className="relative w-full h-full">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-200"
            >
                <IoClose size={24} />
            </button>

            {/* Map */}
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={18}
            >
                {coordinates.length > 2 && (
                    <Polygon paths={coordinates} options={polygonOptions} />
                )}
                {coordinates.map((coord, index) => (
                    <Marker
                        key={index}
                        position={coord}
                        icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        }}
                    />
                ))}
            </GoogleMap>

            {/* Area Information Box */}
            {coordinates.length > 2 && (
                <div className="absolute bottom-6 left-1/6 transform -translate-x-1/2 bg-white text-gray-800 p-4 rounded-lg shadow-md z-10 text-center text-sm">
                    <div><strong>Area</strong></div>
                    <div className="flex justify-center gap-4 mt-2">
                        <div>{areaSqM.toFixed(2)} m²</div>
                        <div>{areaHectares.toFixed(2)} hectares</div>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                        <div>{areaAcres.toFixed(2)} acres</div>
                        <div>{areaBigha.toFixed(2)} bigha</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ifrsmapshow;
