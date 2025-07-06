
"use client"

import { useState, useEffect } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  address: string | null
  loading: boolean
  error: string | null
}

interface GeolocationPosition {
  coords: {
    latitude: number
    longitude: number
    accuracy: number
  }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    loading: false,
    error: null,
  })

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported by this browser"))
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => {
            let errorMessage = "Location access denied"
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Location access denied by user"
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information unavailable"
                break
              case error.TIMEOUT:
                errorMessage = "Location request timed out"
                break
            }
            reject(new Error(errorMessage))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        )
      }
    })
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
      )
      
      if (!response.ok) {
        throw new Error("Reverse geocoding failed")
      }
      
      const data = await response.json()
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  const getLocation = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const position = await getCurrentLocation()
      const { latitude, longitude } = position.coords
      
      // Get address from coordinates
      const address = await reverseGeocode(latitude, longitude)
      
      setState({
        latitude,
        longitude,
        address,
        loading: false,
        error: null,
      })
      
      return { latitude, longitude, address }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get location"
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      throw error
    }
  }

  const clearLocation = () => {
    setState({
      latitude: null,
      longitude: null,
      address: null,
      loading: false,
      error: null,
    })
  }

  return {
    ...state,
    getLocation,
    clearLocation,
  }
}
