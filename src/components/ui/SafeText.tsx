import React from 'react';
import { Text, TextProps } from 'react-native';

export const SafeText: React.FC<TextProps> = ({ children, ...props }) => {
  // Gracefully handle undefined, null, or boolean children to prevent Metro text-node crashes
  if (children === undefined || children === null || typeof children === 'boolean') {
    return null;
  }

  // Ensure content is safely rendered within Text
  return (
    <Text {...props}>
      {children}
    </Text>
  );
};
