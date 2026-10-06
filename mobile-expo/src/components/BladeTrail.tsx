import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { BladePoint, BladeStyle } from '../types';

interface BladeTrailProps {
  trail: BladePoint[];
  blade: BladeStyle;
  width: number;
  height: number;
}

export const BladeTrail: React.FC<BladeTrailProps> = ({ trail, blade, width, height }) => {
  if (trail.length < 2) return null;

  // Build SVG path string from points
  let pathD = `M ${trail[0].x} ${trail[0].y}`;
  for (let i = 1; i < trail.length; i++) {
    const prev = trail[i - 1];
    const curr = trail[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    pathD += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
  }
  const lastPoint = trail[trail.length - 1];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="50%" stopColor={blade.color} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={blade.glowColor} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Outer Glow */}
        <Path
          d={pathD}
          fill="none"
          stroke={blade.glowColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />

        {/* Primary Color Stroke */}
        <Path
          d={pathD}
          fill="none"
          stroke={blade.color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Core Blade White Light */}
        <Path
          d={pathD}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tip Star/Glow */}
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={7}
          fill="#FFFFFF"
        />
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={12}
          fill={blade.color}
          opacity={0.5}
        />
      </Svg>
    </View>
  );
};
