// components/GoogleMapProvider.tsx
"use client";
import React from "react";
import { LoadScript } from "@react-google-maps/api";

const GoogleMapProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <LoadScript googleMapsApiKey="AIzaSyBDR0JbLRuagtWQgA2bpRUTprisPetZ1wA">
      {children}
    </LoadScript>
  );
};

export default GoogleMapProvider;

