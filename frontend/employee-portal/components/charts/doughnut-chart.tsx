import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

// Animated SVG Components
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ChartConfig {
  width?: number;
  height?: number;
  showLabels?: boolean;
  animated?: boolean;
  duration?: number;
  innerRadius?: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

type Props = {
  data: ChartDataPoint[]
  config?: ChartConfig;
  style?: ViewStyle;
};

// Extracted sub-component so hooks aren't called inside a .map() callback
type AnimatedSliceProps = {
  pathData: string;
  fill: string;
  animationProgress: SharedValue<number>;
  showLabels: boolean;
  labelX: number;
  labelY: number;
  percentage: number;
};

function AnimatedSlice({
  pathData,
  fill,
  animationProgress,
  showLabels,
  labelX,
  labelY,
  percentage,
}: AnimatedSliceProps) {
  const sliceAnimatedProps = useAnimatedProps(() => ({
    opacity: animationProgress.value,
  }));

  return (
    <G>
      <AnimatedPath
        d={pathData}
        fill={fill}
        animatedProps={sliceAnimatedProps}
      />
      {showLabels && (
        <SvgText
          x={labelX}
          y={labelY}
          textAnchor='middle'
          fontSize={12}
          fill='#FFFFFF'
          fontWeight='600'
        >
          {percentage}%
        </SvgText>
      )}
    </G>
  );
}

export const DoughnutChart = ({ data, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);

  const {
    height = 200,
    showLabels = true,
    animated = true,
    duration = 1000,
    innerRadius = 0.5, // Default inner radius as ratio of outer radius
  } = config;

  const chartWidth = containerWidth || config.width || 300;

  // All color hooks must be called unconditionally at the top level
  const primaryColor = useColor('primary');
  const blueColor = useColor('blue');
  const greenColor = useColor('green');
  const orangeColor = useColor('orange');
  const purpleColor = useColor('purple');
  const pinkColor = useColor('pink');

  const colors = [primaryColor, blueColor, greenColor, orangeColor, purpleColor, pinkColor];

  const animationProgress = useSharedValue(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: measuredWidth } = event.nativeEvent.layout;
    if (measuredWidth > 0) {
      setContainerWidth(measuredWidth);
    }
  };

  useEffect(() => {
    if (animated) {
      animationProgress.value = withTiming(1, { duration });
    } else {
      animationProgress.value = 1;
    }
  }, [data, animated, duration, animationProgress]);

  if (!data.length) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const outerRadius = Math.min(chartWidth, height) / 2 - 20;
  const innerRadiusValue = outerRadius * innerRadius;
  const centerX = chartWidth / 2;
  const centerY = height / 2;

  let currentAngle = -Math.PI / 2;

  return (
    <View style={[{ width: '100%' }, style]} onLayout={handleLayout}>
      <Svg width={chartWidth} height={height}>
        {data.map((item, index) => {
          const sliceAngle = (item.value / total) * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;

          const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

          // Outer arc points
          const x1 = centerX + outerRadius * Math.cos(startAngle);
          const y1 = centerY + outerRadius * Math.sin(startAngle);
          const x2 = centerX + outerRadius * Math.cos(endAngle);
          const y2 = centerY + outerRadius * Math.sin(endAngle);

          // Inner arc points
          const x3 = centerX + innerRadiusValue * Math.cos(endAngle);
          const y3 = centerY + innerRadiusValue * Math.sin(endAngle);
          const x4 = centerX + innerRadiusValue * Math.cos(startAngle);
          const y4 = centerY + innerRadiusValue * Math.sin(startAngle);

          const pathData = [
            `M ${x1} ${y1}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerRadiusValue} ${innerRadiusValue} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
            'Z',
          ].join(' ');

          // Label position
          const labelAngle = startAngle + sliceAngle / 2;
          const labelRadius = (outerRadius + innerRadiusValue) / 2;
          const labelX = centerX + labelRadius * Math.cos(labelAngle);
          const labelY = centerY + labelRadius * Math.sin(labelAngle);

          currentAngle = endAngle;

          return (
            <AnimatedSlice
              key={`slice-${index}`}
              pathData={pathData}
              fill={item.color || colors[index % colors.length]}
              animationProgress={animationProgress}
              showLabels={showLabels}
              labelX={labelX}
              labelY={labelY}
              percentage={Math.round((item.value / total) * 100)}
            />
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={{ marginTop: 10 }}>
        {data.map((item, index) => (
          <View
            key={`legend-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 5,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: item.color || colors[index % colors.length],
                marginRight: 8,
              }}
            />
            <Text variant='caption'>
              {item.label}: {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
