import React from 'react';
import { useShelterStore } from '@store/shelterStore';
import { ShelterMarker } from './ShelterMarker';

export const ShelterLayer = React.memo(() => {
  const shelters = useShelterStore((state) => state.shelters);

  return (
    <>
      {shelters.map((shelter) => (
        <ShelterMarker key={shelter.id} shelter={shelter} />
      ))}
    </>
  );
});
