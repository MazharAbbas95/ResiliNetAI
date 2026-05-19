import React, { useEffect, useState } from 'react';
import { Polyline, Circle } from 'react-native-maps';
import { agentEventBus } from '../../agents/core/AgentEvents';

interface NegotiationLink {
  id: string;
  sourceAgent: string;
  targetAgent: string;
  coordinates: { latitude: number; longitude: number }[];
  timestamp: number;
}

export const NegotiationVisualizationLayer = () => {
  const [links, setLinks] = useState<NegotiationLink[]>([]);

  useEffect(() => {
    // When a negotiation or dispute starts, we visualize a link between two points 
    // For visual purposes, we'll draw a pulsing line between the user/route and the hazard centroid
    const handleDispute = (event: any) => {
      const payload = event.payload;
      if (payload && payload.debate) {
        // Find if we have coordinates
        // Usually, the debate involves a hazard. We can find the hazard location from memory,
        // or if it's passed in the payload. Let's assume we get lat/lng.
        const lat = payload.lat || payload.originalTask?.payload?.lat;
        const lng = payload.lng || payload.originalTask?.payload?.lng;
        
        if (lat && lng) {
          // For visual impact, we create a slight offset line to represent agent-to-agent negotiation over a region
          const coords = [
            { latitude: lat - 0.002, longitude: lng - 0.002 },
            { latitude: lat + 0.002, longitude: lng + 0.002 }
          ];

          setLinks(prev => [...prev, {
            id: payload.debate.negotiationId || Math.random().toString(),
            sourceAgent: event.sourceAgent,
            targetAgent: event.targetAgent || 'SYSTEM',
            coordinates: coords,
            timestamp: Date.now()
          }].slice(-3));
        }
      }
    };

    const unsubStart = agentEventBus.subscribe('NEGOTIATION_STARTED', handleDispute);
    const unsubDispute = agentEventBus.subscribe('ROUTE_DISPUTED', handleDispute);

    const interval = setInterval(() => {
      const now = Date.now();
      setLinks(prev => prev.filter(l => now - l.timestamp < 10000));
    }, 2000);

    return () => {
      unsubStart();
      unsubDispute();
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {links.map(link => (
        <React.Fragment key={link.id}>
          <Polyline
            coordinates={link.coordinates}
            strokeColor="rgba(0, 255, 255, 0.8)"
            strokeWidth={2}
            lineDashPattern={[5, 10]}
            zIndex={20}
          />
          <Circle
            center={link.coordinates[0]}
            radius={20}
            fillColor="rgba(0, 255, 255, 0.4)"
            strokeColor="rgba(0, 255, 255, 1)"
            zIndex={21}
          />
          <Circle
            center={link.coordinates[1]}
            radius={20}
            fillColor="rgba(255, 0, 255, 0.4)"
            strokeColor="rgba(255, 0, 255, 1)"
            zIndex={21}
          />
        </React.Fragment>
      ))}
    </>
  );
};
