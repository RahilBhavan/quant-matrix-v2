import React from 'react';

interface BlockSocketProps {
  position: 'top' | 'bottom';
  connected?: boolean;
  incompatible?: boolean;
  protocolColor?: string;
}

export const BlockSocket: React.FC<BlockSocketProps> = ({
  position,
  connected = false,
  incompatible = false,
  protocolColor,
}) => {
  const getColor = () => {
    if (incompatible) return 'bg-error';
    if (connected) return 'bg-ink';
    return 'bg-gray-300';
  };

  const positionClass = position === 'top' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';

  return (
    <div
      className={`absolute ${getColor()} ${positionClass} transition-colors`}
      style={{
        width: '4px',
        height: '4px',
        ...(connected && protocolColor ? { backgroundColor: protocolColor } : {}),
      }}
    />
  );
};
