"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L, { LatLngTuple } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

const DEFAULT_CENTER: LatLngTuple = [-6.7924, 39.2083];

function RecenterMap({ center }: { center: LatLngTuple }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [map, center]);

  return null;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

interface EventMapPickerProps {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  onChange: (lat: number, lng: number) => void;
}

export default function EventMapPicker({
  latitude,
  longitude,
  locationName,
  onChange,
}: EventMapPickerProps) {
  const position =
    typeof latitude === "number" && typeof longitude === "number"
      ? ([latitude, longitude] as LatLngTuple)
      : DEFAULT_CENTER;

  const markerIcon = useMemo(
    () =>
      L.icon({
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    [],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <MapContainer
        center={position}
        zoom={13}
        className="h-64 w-full"
        scrollWheelZoom={false}
      >
        <RecenterMap center={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={onChange} />
        <Marker
          icon={markerIcon}
          position={position}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target as L.Marker;
              const next = marker.getLatLng();
              onChange(next.lat, next.lng);
            },
          }}
        >
          <Popup>
            {locationName?.trim() || "Selected event location"}
            <br />
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </Popup>
        </Marker>
      </MapContainer>
      <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600">
        Drag marker or click map to set coordinates.
      </div>
    </div>
  );
}
