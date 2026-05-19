import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocationStore } from '@store/locationStore';
import { useSocialSignalStore } from '@store/socialSignalStore';
import { MAP_STYLE_DARK } from './mapStyle';
import { MAPS_CONFIG } from '@config/maps';
import { HazardLayer } from './HazardLayer';
import { ShelterLayer } from './ShelterLayer';
import { UserMarker } from './UserMarker';
import { SocialSignalLayer } from './SocialSignalLayer';
import { HazardLayerManager } from '../../maps/HazardLayerManager';
import MapViewDirections from 'react-native-maps-directions';
import { SafeRouteRenderer } from '../../navigation/rendering/SafeRouteRenderer';
import { EmergencyFacilityMarker } from '../../emergency/infrastructure/EmergencyFacilityMarker';
import { RadiusVisualization } from '../../emergency/safeRadius/RadiusVisualization';
import { useNavigationStore } from '../../store/navigationStore';
import { usePlacesStore, EmergencyPlace } from '../../store/placesStore';
import { RouteEngine } from '../../navigation/RouteEngine';
import { COLORS } from '@theme';
import { AgentActivityOverlay } from './AgentActivityOverlay';
import { RerouteIntelligenceLayer } from './RerouteIntelligenceLayer';
import { NegotiationVisualizationLayer } from './NegotiationVisualizationLayer';

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const LiveMap = ({ 
  onZoneSelect,
  onPlaceSelect
}: { 
  onZoneSelect?: (id: string) => void;
  onPlaceSelect?: (place: EmergencyPlace) => void;
}) => {
  const mapRef = useRef<MapView>(null);
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const isAutoFollowEnabled = useLocationStore((state) => state.isAutoFollowEnabled);
  const toggleAutoFollow = useLocationStore((state) => state.toggleAutoFollow);
  const socialReports = useSocialSignalStore((state) => state.reports);
  const routeInfo = useNavigationStore((state) => state.routeInfo);
  const { places } = usePlacesStore();

  const hasInitiallyFocused = useRef(false);

  useEffect(() => {
    if (currentLocation && !hasInitiallyFocused.current && mapRef.current) {
      hasInitiallyFocused.current = true;
      mapRef.current.animateCamera({
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        zoom: 17,
      }, { duration: 1500 });
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation && isAutoFollowEnabled && mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        pitch: 45,
        heading: currentLocation.heading || 0,
        zoom: 17,
      }, { duration: 1000 });
    }
  }, [currentLocation, isAutoFollowEnabled]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={MAP_STYLE_DARK}
        initialRegion={MAPS_CONFIG.defaultRegion}
        showsUserLocation={false}
        showsPointsOfInterest={false}
        showsCompass={false}
        onPanDrag={() => {
          if (isAutoFollowEnabled) toggleAutoFollow();
        }}
      >
        <RadiusVisualization />
        <HazardLayer />
        <HazardLayerManager onZoneSelect={onZoneSelect || (() => {})} />
        <ShelterLayer />
        <SocialSignalLayer reports={socialReports} />
        {currentLocation && <UserMarker location={currentLocation} />}

        {/* Emergency Infrastructure Layer */}
        {places.map((place) => (
          <EmergencyFacilityMarker 
            key={place.id} 
            place={place} 
            onPress={onPlaceSelect || (() => {})} 
          />
        ))}

        {/* Intelligent Routing Layer */}
        {currentLocation && routeInfo?.destination && (
          <MapViewDirections
            origin={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            destination={routeInfo.destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={0} // We use our custom RoutePolyline for cinematic styling
            strokeColor="transparent"
            mode="DRIVING"
            precision="high"
            onReady={(result) => RouteEngine.handleRouteReady(result, routeInfo.destination)}
            onError={(errorMessage) => RouteEngine.handleRouteError(errorMessage)}
          />
        )}
        <SafeRouteRenderer />
        <AgentActivityOverlay />
        <RerouteIntelligenceLayer />
        <NegotiationVisualizationLayer />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
