import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  Animated,
  Platform, 
  Pressable,
  Alert,
  TextInput,
  Switch,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ICON_HOVER_SCALE = 1.15;
const DEFAULT_THEME_COLOR = '#000000';
const PRIMARY_FONT = 'Inter_400Regular';
const THEME_PALETTE = [
  '#000000',
  '#ffffff',
  '#ff2d8d',
  '#b166ff',
  '#a855f7',
  '#7f8ba4',
  '#12d6e0',
  '#06b3c5',
  '#0cc2aa',
  '#4a90e2',
  '#1f6bff',
  '#00c3ff',
  '#357ab8',
  '#ff7ab2',
  '#ff6f61',
  '#ff1493'
];

const hexToRgb = (hex) => {
  if (!hex) {
    return { r: 0, g: 0, b: 0 };
  }
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized.length === 3
    ? sanitized.split('').map((char) => char + char).join('')
    : sanitized, 16);
  if (Number.isNaN(bigint)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const deriveThemeTokens = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const isDark = luminance < 0.5;

  return {
    isDark,
    text: isDark ? '#ffffff' : '#050505',
    mutedText: isDark ? '#d4d4d4' : '#1e1e1e',
    border: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
    softBorder: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    surface: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    surfaceStrong: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
  };
};

export default function CounterScreen({ onLayoutRootView, navigation }) {
  const { width } = useWindowDimensions();
  const [count, setCount] = useState(0);
  const [incrementValue, setIncrementValue] = useState(1);
  const [decrementValue, setDecrementValue] = useState(1);
  const [maxValue, setMaxValue] = useState(null);
  const [minValue, setMinValue] = useState(null);
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [limitsEnabled, setLimitsEnabled] = useState(false);
  const [setCountInput, setSetCountInput] = useState('0');
  const themeTokens = useMemo(() => deriveThemeTokens(themeColor), [themeColor]);
  const {
    isDark: isDarkTheme,
    text: primaryTextColor,
    mutedText: mutedTextColor,
    border: borderColor,
    softBorder,
    surface,
    surfaceStrong,
  } = themeTokens;

  // desktop breakpoint
  const isDesktop = width > 600; 

  // load settings and count when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadCount();
    }, [])
  );

  useEffect(() => {
    setSetCountInput(String(count));
  }, [count]);

  const loadSettings = async () => {
    try {
      const increment = await AsyncStorage.getItem('incrementValue');
      const decrement = await AsyncStorage.getItem('decrementValue');
      const max = await AsyncStorage.getItem('maxValue');
      const min = await AsyncStorage.getItem('minValue');
      const storedTheme = await AsyncStorage.getItem('themeColor');
      const storedLimits = await AsyncStorage.getItem('limitsEnabled');

      if (increment !== null) setIncrementValue(parseInt(increment));
      if (decrement !== null) setDecrementValue(parseInt(decrement));
      if (max !== null) setMaxValue(max === 'null' ? null : parseInt(max));
      if (min !== null) setMinValue(min === 'null' ? null : parseInt(min));
      if (storedTheme) setThemeColor(storedTheme);
      if (storedLimits !== null) setLimitsEnabled(storedLimits === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadCount = async () => {
    try {
      const savedCount = await AsyncStorage.getItem('count');
      if (savedCount !== null) {
        setCount(parseInt(savedCount));
      }
    } catch (error) {
      console.error('Error loading count:', error);
    }
  };

  const saveCount = async (newCount) => {
    try {
      await AsyncStorage.setItem('count', newCount.toString());
    } catch (error) {
      console.error('Error saving count:', error);
    }
  };

  const persistTheme = useCallback(async (color) => {
    try {
      await AsyncStorage.setItem('themeColor', color);
    } catch (error) {
      console.error('Error saving theme color:', error);
    }
  }, []);

  const handleThemeSelection = useCallback(
    (color) => {
      setThemeColor(color);
      persistTheme(color);
    },
    [persistTheme]
  );

  const handleToggleLimits = useCallback(async () => {
    const nextValue = !limitsEnabled;
    setLimitsEnabled(nextValue);
    try {
      await AsyncStorage.setItem('limitsEnabled', nextValue ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving limits flag:', error);
    }
  }, [limitsEnabled]);

  const handleSetCountChange = (value) => {
    if (/^-?\d*$/.test(value)) {
      setSetCountInput(value);
    }
  };

  const handleSetCountSubmit = () => {
    if (setCountInput.trim() === '' || setCountInput === '-') {
      return;
    }
    const parsed = parseInt(setCountInput, 10);
    if (!Number.isNaN(parsed)) {
      setCount(parsed);
      saveCount(parsed);
    }
  };

  const openExternalLink = useCallback((url) => {
    if (!url) {
      return;
    }
    Linking.openURL(url).catch((error) => {
      console.error('Error opening link:', error);
    });
  }, []);

  const handleIncrement = () => {
    const newCount = count + incrementValue;

    if (limitsEnabled && maxValue !== null && newCount > maxValue) {
      Alert.alert('Limit Reached', `Maximum value is ${maxValue}`);
      return;
    }

    setCount(newCount);
    saveCount(newCount);
  };

  const handleDecrement = () => {
    const newCount = count - decrementValue;

    if (newCount < 0) {
      return;
    }

    if (limitsEnabled && minValue !== null && newCount < minValue) {
      Alert.alert('Limit Reached', `Minimum value is ${minValue}`);
      return;
    }

    setCount(newCount);
    saveCount(newCount);
  };

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayTranslate = useRef(new Animated.Value(40)).current;
  const iconsTranslate = useRef(new Animated.Value(0)).current;
  const closeScale = useRef(new Animated.Value(0.85)).current;
  const [overlayConfig, setOverlayConfig] = useState(null);

  useEffect(() => {
    if (!overlayConfig) {
      return;
    }

    overlayOpacity.setValue(0);
    overlayTranslate.setValue(40);
    closeScale.setValue(0.85);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(overlayTranslate, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.spring(closeScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 180,
      }),
    ]).start();
  }, [overlayConfig, overlayOpacity, overlayTranslate, closeScale]);

  const closeOverlay = useCallback(() => {
    if (!overlayConfig) {
      return;
    }

    Animated.spring(iconsTranslate, {
      toValue: 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
    }).start();

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(overlayTranslate, {
        toValue: 40,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(closeScale, {
        toValue: 0.85,
        useNativeDriver: true,
        damping: 15,
        stiffness: 180,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setOverlayConfig(null);
      }
    });
  }, [overlayConfig, overlayOpacity, overlayTranslate, iconsTranslate, closeScale]);

  const openOverlay = useCallback((config) => {
    Animated.spring(iconsTranslate, {
      toValue: -40,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
    }).start();
    setOverlayConfig(config);
  }, [iconsTranslate]);

  const handleOverlayAction = useCallback(
    (action) => {
      action?.onPress?.();
      closeOverlay();
    },
    [closeOverlay]
  );

  const handleInfo = () => {
    openOverlay({ variant: 'info' });
  };

  const handleSettings = () => {
    setSetCountInput(String(count));
    openOverlay({ variant: 'settings' });
  };

  const handleReset = () => {
    openOverlay({
      variant: 'reset',
      actions: [
        {
          label: 'Yes',
          variant: 'primary',
          onPress: () => {
            setCount(0);
            saveCount(0);
          },
        },
        { label: 'Cancel' },
      ],
    });
  };

  const useHoverHandlers = (setIsHovered) =>
    Platform.OS === 'web'
      ? {
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => setIsHovered(false),
        }
      : {};

  const InfoPrimaryButton = ({ label, onPress }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        {...useHoverHandlers(setIsHovered)}
        style={({ pressed }) => [
          styles.infoPrimaryButton,
          (pressed || isHovered) && styles.infoPrimaryButtonPressed,
          Platform.OS === 'web' && { cursor: 'pointer' },
        ]}
      >
        <Text style={styles.infoPrimaryButtonLabel}>{label}</Text>
      </Pressable>
    );
  };

  const InfoSecondaryButton = ({ label, onPress }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        {...useHoverHandlers(setIsHovered)}
        style={({ pressed }) => [
          styles.infoSecondaryButton,
          (pressed || isHovered) && styles.infoSecondaryButtonPressed,
          Platform.OS === 'web' && { cursor: 'pointer' },
        ]}
      >
        <Text style={styles.infoSecondaryLabel}>{label}</Text>
      </Pressable>
    );
  };

  const ResetPrimaryButton = ({ label, onPress }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        {...useHoverHandlers(setIsHovered)}
        style={({ pressed }) => [
          styles.resetPrimaryButton,
          {
            transform: [{ scale: pressed || isHovered ? 1.125 : 1 }],
            borderColor: pressed || isHovered ? '#ffffff' : 'rgba(255,255,255,0)',
          },
          Platform.OS === 'web' && { cursor: 'pointer' },
        ]}
      >
        <Text style={styles.resetPrimaryLabel}>{label}</Text>
      </Pressable>
    );
  };

  const TextLinkButton = ({ label, onPress, textStyle }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        {...useHoverHandlers(setIsHovered)}
        style={Platform.OS === 'web' && { cursor: 'pointer' }}
      >
        <Text
          style={[
            textStyle || styles.resetSecondaryLabel,
            isHovered && styles.resetSecondaryLabelHover,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const PaletteSwatch = ({ color, isActive, onPress }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        {...useHoverHandlers(setIsHovered)}
        style={[
          styles.paletteSwatchWrapper,
          { borderColor: softBorder },
          isActive && styles.paletteSwatchWrapperActive,
          (isHovered || isActive) && styles.paletteSwatchWrapperHover,
          Platform.OS === 'web' && { cursor: 'pointer' },
        ]}
      >
        <View
          style={[
            styles.paletteSwatch,
            { backgroundColor: color },
            isActive && styles.paletteSwatchActive,
          ]}
        />
      </Pressable>
    );
  };

  const IconButton = ({ iconName, onPress, size }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
        style={({ pressed }) => [
          styles.iconButton,
          {
            transform: [{ scale: (isHovered || pressed) ? ICON_HOVER_SCALE : 1 }],
          },
          Platform.OS === 'web' && { cursor: 'pointer' },
        ]}
      >
        <View
          style={[
            styles.iconGlyphWrap,
            {
              borderColor,
            },
          ]}
        >
          <Ionicons name={iconName} size={size} color={primaryTextColor} />
        </View>
      </Pressable>
    );
  };

  const CircleButton = ({ iconName, onPress, disabled = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
        style={({ pressed }) => [
          styles.circleButton,
          {
            opacity: disabled ? 0.3 : 1,
            borderColor: isHovered ? primaryTextColor : borderColor,
            backgroundColor: pressed || isHovered ? surfaceStrong : surface,
          },
          Platform.OS === 'web' && { cursor: disabled ? 'default' : 'pointer' },
        ]}
        disabled={disabled}
      >
        <Ionicons name={iconName} size={40} color={primaryTextColor} />
      </Pressable>
    );
  };

  const OverlayCloseButton = ({ onPress, animatedScale }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
        style={[
          styles.overlayCloseTouchable,
          Platform.OS === 'web' && { cursor: 'pointer' },
        ]}
      >
        <Animated.View
          style={[
            styles.overlayClose,
            {
              transform: [
                { scale: animatedScale },
                { scale: isHovered ? 1.08 : 1 },
              ],
            },
          ]}
        >
          <Ionicons name="close" size={34} color="#ffffff" />
        </Animated.View>
      </Pressable>
    );
  };

  const renderOverlayBody = () => {
    if (!overlayConfig) {
      return null;
    }

    if (overlayConfig.variant === 'info') {
      return (
        <View style={styles.infoContainer}>
          <Text style={[styles.overlayTitle, styles.infoTitle, { fontWeight: 'bold' }]}>Counter App</Text>
          <Text style={styles.infoSubtitle}>
          A simple and intuitive tool designed to help you count and keep track of numbers effortlessly.
          </Text>

          <InfoPrimaryButton
            label="Star on GitHub ❤️"
            onPress={() => openExternalLink('https://www.github.com/mvntech/counter-cross-platform-app')}
          />
          <Text style={styles.infoMeta}>By Syeda Muntaha!</Text>
        </View>
      );
    }

    if (overlayConfig.variant === 'settings') {
      return (
        <View style={styles.settingsContainer}>
          <ScrollView
            style={styles.settingsScroll}
            contentContainerStyle={styles.settingsScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.settingsCard}>
              <Text style={styles.settingsLabel}>Set count =</Text>
              <TextInput
                value={setCountInput}
                onChangeText={handleSetCountChange}
                onSubmitEditing={handleSetCountSubmit}
                keyboardType="number-pad"
                returnKeyType="done"
                style={styles.settingsInput}
                placeholder="0"
                placeholderTextColor="#7a7a7a"
              />
            </View>

            <View style={styles.settingsCard}>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>Limits Off / On</Text>
                <Switch
                  value={limitsEnabled}
                  onValueChange={handleToggleLimits}
                  trackColor={{ false: '#2f2f2f', true: '#34c759' }}
                  thumbColor="#f4f4f5"
                  ios_backgroundColor="#2f2f2f"
                />
              </View>
              {/* <Text style={[styles.settingsHelper, { color: mutedTextColor }]}>
                // saved min and max values
              </Text> */}
            </View>

            <View style={styles.settingsCard}>
              {/* <Text style={[styles.settingsLabel, styles.paletteLabel]}>
                // choose a theme
              </Text> */}
              <View style={styles.paletteGrid}>
                {THEME_PALETTE.map((color) => (
                  <PaletteSwatch
                    key={color}
                    color={color}
                    isActive={color === themeColor}
                    onPress={() => handleThemeSelection(color)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    if (overlayConfig.variant === 'reset') {
      const [primaryAction, secondaryAction] = overlayConfig.actions || [];
      return (
        <View style={styles.resetContainer}>
          <Text style={[styles.overlayTitle, styles.resetTitle]}>Reset Counter?</Text>

          <View style={styles.resetActions}>
            {primaryAction && (
              <ResetPrimaryButton
                label={primaryAction.label}
                onPress={() => handleOverlayAction(primaryAction)}
              />
            )}

            {secondaryAction && (
              <ResetPrimaryButton
                label={secondaryAction.label}
                onPress={() => handleOverlayAction(secondaryAction)}
              />
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColor }]}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />

      <Animated.View
        style={[styles.topBar, { transform: [{ translateY: iconsTranslate }] }]}
        onLayout={onLayoutRootView}
      >
        <IconButton
          iconName="information-circle"
          onPress={handleInfo}
          size={38}
        />

        <IconButton
          iconName="settings-sharp"
          onPress={handleSettings} 
          size={34}
        />

        <IconButton
          iconName="refresh"
          onPress={handleReset}
          size={34}
        />
      </Animated.View>

      <View style={styles.counterContainer}>
        <Text 
          style={[styles.counterValue, { color: primaryTextColor }]} 
          numberOfLines={1} 
          adjustsFontSizeToFit
        >
          {count}
        </Text>
      </View>

      <View style={isDesktop ? styles.desktopControls : styles.mobileControls}>
        <CircleButton
          iconName="remove"
          onPress={handleDecrement}
          disabled={count === 0}
        />
        
        {/* Increment Button */}
        <CircleButton
          iconName="add"
          onPress={handleIncrement}
        />
      </View>

      {overlayConfig && (
        <Animated.View
          style={[
            styles.overlayBackdrop,
            {
              opacity: overlayOpacity,
            },
          ]}
          pointerEvents="auto"
        >
          <Pressable style={styles.overlayTouchable} onPress={closeOverlay} />

          <Animated.View
            style={[
              styles.overlayContent,
              { transform: [{ translateY: overlayTranslate }] },
            ]}
          >
            {renderOverlayBody()}
          </Animated.View>

          <OverlayCloseButton
            onPress={closeOverlay}
            animatedScale={closeScale}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    zIndex: 10,
  },
  iconButton: {
    padding: 10,
    transitionProperty: Platform.OS === 'web' ? 'transform' : undefined,
    transitionDuration: Platform.OS === 'web' ? '200ms' : undefined,
  },
  counterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  counterValue: {
    fontSize: 200,
    fontWeight: '300',
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
    fontFamily: 'Inter_400Regular'
  },
  
  mobileControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 40,
    width: '100%',
  },

  desktopControls: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: -40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
    pointerEvents: 'box-none',
  },

  circleButton: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 20,
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    width: '100%',
    backgroundColor: '#000000',
    paddingHorizontal: 34,
    paddingVertical: 40,
  },
  overlayTitle: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: '500',
    letterSpacing: 0.6,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: PRIMARY_FONT,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoTitle: {
    marginBottom: 16,
  },
  infoSubtitle: {
    fontSize: 16,
    color: '#c2c2c2',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    fontFamily: PRIMARY_FONT,
  },
  overlayLink: {
    color: '#ffffff',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  infoPrimaryButton: {
    borderColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderRadius: 8,
    transitionProperty: Platform.OS === 'web' ? 'transform, border-color' : undefined,
    transitionDuration: Platform.OS === 'web' ? '300ms' : undefined,
  },
  infoPrimaryButtonPressed: {
    opacity: 0.9,
  },
  infoPrimaryButtonLabel: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: PRIMARY_FONT,
  },
  infoMeta: {
    color: '#bcbcbc',
    fontSize: 15,
    marginBottom: 18,
    fontFamily: PRIMARY_FONT,
  },
  infoSecondaryButton: {
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  infoSecondaryButtonPressed: {
    backgroundColor: '#ffffff12',
  },
  infoSecondaryLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: PRIMARY_FONT,
  },
  settingsContainer: {
    width: '100%',
  },
  settingsScroll: {
    width: '100%',
  },
  settingsScrollContent: {
    paddingBottom: 10,
  },
  settingsCard: {
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 18
  },
  settingsLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '400',
    fontFamily: PRIMARY_FONT,
  },
  settingsInput: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    color: '#000000',
    fontSize: 20,
    backgroundColor: '#ffffff',
    fontFamily: PRIMARY_FONT,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsHelper: {
    marginTop: 12,
    color: '#b0b0b0',
    fontSize: 14,
    fontFamily: PRIMARY_FONT,
  },
  paletteLabel: {
    marginBottom: 16,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paletteSwatchWrapper: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteSwatchWrapperActive: {
    borderColor: '#ffffff',
    shadowRadius: 8,
    elevation: 6,
  },
  paletteSwatchWrapperHover: {
    borderColor: '#ffffff',
  },
  paletteSwatch: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  paletteSwatchActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  resetContainer: {
    alignItems: 'center',
  },
  resetTitle: {
    marginBottom: 16,
  },
  resetActions: {
    marginTop: 10,
    alignItems: 'center',
  },
  resetPrimaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    width: 112,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: Platform.OS === 'web' ? 'transform, border-color' : undefined,
    transitionDuration: Platform.OS === 'web' ? '300ms' : undefined,
  },
  resetPrimaryLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: PRIMARY_FONT,
  },
  resetSecondaryLabel: {
    color: '#dcdcdc',
    fontSize: 16,
    fontFamily: PRIMARY_FONT,
  },
  resetSecondaryLabelHover: {
    color: '#ffffff',
  },
  overlayCloseTouchable: {
    position: 'absolute',
    top: 40,
    right: 24,
  },
  overlayClose: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#2f2f2f',
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlyphWrap: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});