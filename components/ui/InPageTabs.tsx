import { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';

interface Tab {
  key: string;
  label: string;
}

interface InPageTabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function InPageTabs({ tabs, activeKey, onChange, className = '' }: InPageTabsProps) {
  const activeIndex = tabs.findIndex((t) => t.key === activeKey);
  const translateX = useRef(new Animated.Value(0)).current;
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabOffsets, setTabOffsets] = useState<number[]>([]);

  useEffect(() => {
    if (tabOffsets.length === 0 || tabWidths.length === 0) return;
    const targetX = tabOffsets[activeIndex] ?? 0;
    Animated.spring(translateX, {
      toValue: targetX,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [activeIndex, tabOffsets, translateX]);

  const handleTabLayout = (index: number, x: number, width: number) => {
    setTabOffsets((prev) => {
      const next = [...prev];
      next[index] = x;
      return next;
    });
    setTabWidths((prev) => {
      const next = [...prev];
      next[index] = width;
      return next;
    });
  };

  const indicatorWidth = tabWidths[activeIndex] ?? 0;

  return (
    <View className={className}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-border"
      >
        <View className="flex-row relative">
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeKey;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => onChange(tab.key)}
                activeOpacity={0.7}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  handleTabLayout(index, x, width);
                }}
                className="px-4 py-3 items-center"
              >
                <Text
                  className={`text-sm ${isActive ? 'text-primary font-semibold' : 'text-muted'}`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              width: indicatorWidth,
              height: 2,
              transform: [{ translateX }],
            }}
            className="bg-primary rounded-full"
          />
        </View>
      </ScrollView>
    </View>
  );
}
