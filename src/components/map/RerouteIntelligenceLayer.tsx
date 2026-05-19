import React, { useEffect, useState } from 'react';
import { Polyline } from 'react-native-maps';
import { agentEventBus } from '../../agents/core/AgentEvents';

interface RejectedRoute {
  id: string;
  coordinates: { latitude: number; longitude: number }[];
  timestamp: number;
}

export const RerouteIntelligenceLayer = () => {
  const [rejectedRoutes, setRejectedRoutes] = useState<RejectedRoute[]>([]);
  const [unstableCorridors, setUnstableCorridors] = useState<RejectedRoute[]>([]);
  const [futureUnsafeRoutes, setFutureUnsafeRoutes] = useState<RejectedRoute[]>([]);

  useEffect(() => {
    const unsubUnsafe = agentEventBus.subscribe('ROUTE_UNSAFE', (event) => {
      if (event.payload?.corridorCoordinates) {
        setRejectedRoutes(prev => [...prev, {
          id: Math.random().toString(),
          coordinates: event.payload.corridorCoordinates,
          timestamp: Date.now()
        }].slice(-5)); // Keep last 5 rejected routes
      }
    });

    const unsubRejected = agentEventBus.subscribe('ROUTE_REJECTED', (event) => {
      if (event.payload?.corridorCoordinates) {
        setUnstableCorridors(prev => [...prev, {
          id: Math.random().toString(),
          coordinates: event.payload.corridorCoordinates,
          timestamp: Date.now()
        }].slice(-3));
      }
    });

    const unsubPredictive = agentEventBus.subscribe('PREDICTIVE_REROUTE_REQUIRED', (event) => {
      if (event.payload?.corridorCoordinates) {
        setFutureUnsafeRoutes(prev => [...prev, {
          id: Math.random().toString(),
          coordinates: event.payload.corridorCoordinates,
          timestamp: Date.now()
        }].slice(-3));
      }
    });

    // Cleanup old routes periodically
    const interval = setInterval(() => {
      const now = Date.now();
      setRejectedRoutes(prev => prev.filter(r => now - r.timestamp < 30000));
      setUnstableCorridors(prev => prev.filter(r => now - r.timestamp < 15000));
      setFutureUnsafeRoutes(prev => prev.filter(r => now - r.timestamp < 15000));
    }, 5000);

    return () => {
      unsubUnsafe();
      unsubRejected();
      unsubPredictive();
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Rejected Routes: Red Dashed */}
      {rejectedRoutes.map((route) => (
        <Polyline
          key={`reject-${route.id}`}
          coordinates={route.coordinates}
          strokeColor="rgba(255, 59, 48, 0.6)"
          strokeWidth={3}
          lineDashPattern={[10, 10]}
          zIndex={5}
        />
      ))}

      {/* Unstable Corridors: Blinking Orange */}
      {unstableCorridors.map((route) => (
        <Polyline
          key={`unstable-${route.id}`}
          coordinates={route.coordinates}
          strokeColor="rgba(255, 149, 0, 0.8)"
          strokeWidth={4}
          lineDashPattern={[5, 5]}
          zIndex={6}
        />
      ))}

      {/* Future Unsafe Corridors: Blinking Cyan/White */}
      {futureUnsafeRoutes.map((route) => (
        <Polyline
          key={`future-${route.id}`}
          coordinates={route.coordinates}
          strokeColor="rgba(0, 255, 255, 0.8)"
          strokeWidth={4}
          lineDashPattern={[5, 10]}
          zIndex={7}
        />
      ))}
    </>
  );
};
