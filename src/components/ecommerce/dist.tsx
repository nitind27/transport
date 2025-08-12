'use client';
import React, { useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap
} from '@vis.gl/react-google-maps';

const CircleOverlay = ({ center }: { center: google.maps.LatLngLiteral }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google) return;

    const circle = new window.google.maps.Circle({
      strokeColor: 'red',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: 'red',
      fillOpacity: 0.35,
      map,
      center,
      radius: 10000, // radius in meters
    });

    return () => {
      circle.setMap(null); // Cleanup when component unmounts
    };
  }, [map, center]);

  return null;
};

const DistrictMap = () => {
  const districts = [
    { name: 'Nandurbar', lat: 21.3700, lng: 74.2400 },
    { name: 'Navapur', lat: 21.1667, lng: 73.7833 },
    { name: 'Shahada', lat: 21.5453, lng: 74.4711 },
    { name: 'Taloda', lat: 21.5614, lng: 74.2125 },
    { name: 'Akkalkuwa', lat: 21.5199, lng: 74.0217 },
    { name: 'Akrani', lat: 21.8242, lng: 74.2208 },
    { name: 'Dhadgaon', lat: 21.8222, lng: 74.2233 },
  ];

  const alertdata = (v: string) => {
    alert(v);
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <APIProvider apiKey="YOUR_GOOGLE_MAPS_API_KEY">
        <Map
          mapId="districts-map"
          defaultCenter={{ lat: 21.5, lng: 74.2 }}
          defaultZoom={8}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {districts.map((district, index) => {
            const isNandurbar = district.name === 'Nandurbar';

            return (
              <React.Fragment key={index}>
                <AdvancedMarker
                  position={{ lat: district.lat, lng: district.lng }}
                  title={district.name}
                  onClick={() => alertdata(district.name)}
                >
                  <Pin
                    background={isNandurbar ? 'red' : '#4285F4'}
                    borderColor="white"
                    glyphColor="white"
                    scale={1.2}
                  />
                </AdvancedMarker>

                {isNandurbar && (
                  <CircleOverlay center={{ lat: district.lat, lng: district.lng }} />
                )}
              </React.Fragment>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
};

export default DistrictMap;
