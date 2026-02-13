# Cross-Platform Mobile App Design

> Inherits all rules from [design-core.md](design-core.md). This guide covers cross-platform mobile apps (React Native, Flutter, Expo) with shared visual identity and platform-appropriate patterns.

**See Also:**
- **[Design Core](design-core.md)** - Shared design principles, unified typography scale, spacing scale
- **[iOS Native Patterns](design-mobile-ios.md)** - Apple HIG for iOS-specific guidance
- **[Android Native Patterns](design-mobile-android.md)** - Material Design 3 for Android-specific guidance

---

## 🎯 Core Philosophy

> **Platform conventions for structure, Antigravity for polish**
>
> - **Respect platform idioms:** iOS users expect tab bars and swipe-back, Android users expect FAB and system back button
> - **Share visual identity:** Same colors, spacing, typography across platforms
> - **Platform-detect interaction patterns:** Use platform-specific navigation components

**Critical Principle:** Cross-platform frameworks (React Native, Flutter) allow you to share code while adapting UI patterns per platform. Use this power wisely - share the design tokens (colors, spacing, typography), but render platform-appropriate navigation.

---

## 1. Shared Design Tokens (All Cross-Platform Apps)

### Typography Scale (Unified Across Platforms)

Use the **same numeric scale** from design-core.md:

| Semantic Token | Size | React Native | Flutter | Usage |
|----------------|------|--------------|---------|-------|
| `caption` | 11 | 11 (fontSize) | 11.0 | Smallest labels, metadata |
| `footnote` | 12 | 12 | 12.0 | Small labels, badges |
| `subheadline` | 13 | 13 | 13.0 | Secondary body text |
| `callout` | 15 | 15 | 15.0 | Emphasized body text |
| `body` | 16 | 16 | 16.0 | Default body text (primary) |
| `headline` | 17 | 17 | 17.0 | List headers, emphasized text |
| `title3` | 20 | 20 | 20.0 | Card titles, section headers |
| `title2` | 22 | 22 | 22.0 | Page section headers |
| `title` | 28 | 28 | 28.0 | Large headers |
| `largeTitle` | 34 | 34 | 34.0 | Hero text, onboarding |

**React Native Implementation:**

```javascript
// tokens/typography.js
export const typography = {
  caption: { fontSize: 11, fontWeight: '400' },
  footnote: { fontSize: 12, fontWeight: '400' },
  subheadline: { fontSize: 13, fontWeight: '400' },
  callout: { fontSize: 15, fontWeight: '400' },
  body: { fontSize: 16, fontWeight: '400' },
  headline: { fontSize: 17, fontWeight: '600' },
  title3: { fontSize: 20, fontWeight: '600' },
  title2: { fontSize: 22, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700' },
  largeTitle: { fontSize: 34, fontWeight: '700' },
};

// Usage in component:
import { Text, StyleSheet } from 'react-native';
import { typography } from './tokens/typography';

<Text style={styles.headline}>Welcome</Text>

const styles = StyleSheet.create({
  headline: {
    ...typography.headline,
    color: '#111827',
  },
});
```

**Flutter Implementation:**

```dart
// lib/design/typography.dart
class AppTypography {
  static const TextStyle caption = TextStyle(fontSize: 11, fontWeight: FontWeight.w400);
  static const TextStyle footnote = TextStyle(fontSize: 12, fontWeight: FontWeight.w400);
  static const TextStyle subheadline = TextStyle(fontSize: 13, fontWeight: FontWeight.w400);
  static const TextStyle callout = TextStyle(fontSize: 15, fontWeight: FontWeight.w400);
  static const TextStyle body = TextStyle(fontSize: 16, fontWeight: FontWeight.w400);
  static const TextStyle headline = TextStyle(fontSize: 17, fontWeight: FontWeight.w600);
  static const TextStyle title3 = TextStyle(fontSize: 20, fontWeight: FontWeight.w600);
  static const TextStyle title2 = TextStyle(fontSize: 22, fontWeight: FontWeight.w600);
  static const TextStyle title = TextStyle(fontSize: 28, fontWeight: FontWeight.w700);
  static const TextStyle largeTitle = TextStyle(fontSize: 34, fontWeight: FontWeight.w700);
}

// Usage in widget:
Text(
  'Welcome',
  style: AppTypography.headline.copyWith(color: Colors.grey[900]),
)
```

### Spacing Scale (Unified)

Use the shared 4/8/12/16/20/24/32/48 scale:

**React Native:**
```javascript
// tokens/spacing.js
export const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  base: 16,
  l: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

// Usage:
<View style={{ padding: spacing.base }} />
```

**Flutter:**
```dart
// lib/design/spacing.dart
class AppSpacing {
  static const double xs = 4.0;
  static const double s = 8.0;
  static const double m = 12.0;
  static const double base = 16.0;
  static const double l = 20.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  static const double xxxl = 48.0;
}

// Usage:
Padding(
  padding: EdgeInsets.all(AppSpacing.base),
  child: Text('Content'),
)
```

### Color Tokens (Shared Antigravity Palette)

**React Native:**
```javascript
// tokens/colors.js
export const colors = {
  // Primary
  primary: '#0891B2',         // Cyan 600 (light)
  primaryDark: '#06B6D4',     // Cyan 500 (dark)
  primaryContainer: '#E0F2FE', // Cyan 100

  // Secondary
  secondary: '#6366F1',        // Indigo 500
  secondaryDark: '#818CF8',    // Indigo 400

  // Neutral
  surface: '#FFFFFF',
  surfaceDark: '#121212',
  onSurface: '#111827',
  onSurfaceDark: '#F9FAFB',

  // Semantic
  error: '#DC2626',
  success: '#059669',
};

// Usage with dark mode:
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme();
const bgColor = colorScheme === 'dark' ? colors.surfaceDark : colors.surface;
```

**Flutter:**
```dart
// lib/design/colors.dart
class AppColors {
  // Primary
  static const Color primary = Color(0xFF0891B2);
  static const Color primaryDark = Color(0xFF06B6D4);
  static const Color primaryContainer = Color(0xFFE0F2FE);

  // Secondary
  static const Color secondary = Color(0xFF6366F1);
  static const Color secondaryDark = Color(0xFF818CF8);

  // Neutral
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF121212);
  static const Color onSurface = Color(0xFF111827);
  static const Color onSurfaceDark = Color(0xFFF9FAFB);

  // Semantic
  static const Color error = Color(0xFFDC2626);
  static const Color success = Color(0xFF059669);
}

// Usage with theme:
ThemeData(
  brightness: Brightness.light,
  colorScheme: ColorScheme.light(
    primary: AppColors.primary,
    surface: AppColors.surface,
  ),
)
```

### Corner Radius (Unified)

4/8/10/12/16 scale across platforms:

**React Native:**
```javascript
export const radius = {
  xs: 4,
  s: 8,
  m: 10,  // Antigravity default (matches iOS/Android)
  l: 12,
  xl: 16,
};
```

**Flutter:**
```dart
class AppRadius {
  static const double xs = 4.0;
  static const double s = 8.0;
  static const double m = 10.0;
  static const double l = 12.0;
  static const double xl = 16.0;
}
```

---

## 2. Platform-Specific Navigation Patterns

### Detecting Platform

**React Native:**
```javascript
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
```

**Flutter:**
```dart
import 'dart:io';

bool get isIOS => Platform.isIOS;
bool get isAndroid => Platform.isAndroid;
```

### Bottom Navigation (iOS Tab Bar vs Android Bottom Nav)

**React Native (react-navigation):**

```javascript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        // iOS: Tab bar at bottom with icons + text
        // Android: Bottom navigation with icons + labels
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 80, // Both use 80
          paddingBottom: Platform.OS === 'ios' ? 20 : 8, // iOS safe area
        },
        tabBarLabelStyle: {
          fontSize: 12, // Shared footnote size
        },
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

**Flutter:**

```dart
import 'package:flutter/material.dart';
import 'dart:io';

class AppScaffold extends StatefulWidget {
  @override
  _AppScaffoldState createState() => _AppScaffoldState();
}

class _AppScaffoldState extends State<AppScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: Platform.isIOS
          ? CupertinoTabBar(
              currentIndex: _currentIndex,
              onTap: (index) => setState(() => _currentIndex = index),
              items: [
                BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
                BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
              ],
            )
          : NavigationBar(
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) => setState(() => _currentIndex = index),
              destinations: [
                NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
                NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
              ],
            ),
    );
  }
}
```

### Floating Action Button (Android-Only)

**React Native:**

```javascript
import { Platform, TouchableOpacity, StyleSheet } from 'react-native';

function ScreenWithFAB() {
  return (
    <View style={styles.container}>
      {/* Content */}

      {Platform.OS === 'android' && (
        <TouchableOpacity style={styles.fab} onPress={handleCreate}>
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
```

**Flutter:**

```dart
Scaffold(
  body: Content(),
  floatingActionButton: Platform.isAndroid
      ? FloatingActionButton(
          onPressed: _handleCreate,
          child: Icon(Icons.add),
        )
      : null, // iOS doesn't use FAB
)
```

### Back Navigation

**iOS:** Swipe from left edge (built-in gesture)
**Android:** System back button

**React Native:** Both handled automatically by react-navigation

**Flutter:** Both handled by Navigator

---

## 3. Platform-Specific Components

### Buttons

**React Native:**

```javascript
import { Platform, TouchableOpacity, TouchableNativeFeedback } from 'react-native';

const Button = ({ onPress, children }) => {
  const Touchable = Platform.OS === 'android'
    ? TouchableNativeFeedback // Material ripple on Android
    : TouchableOpacity;        // Opacity feedback on iOS

  return (
    <Touchable onPress={onPress}>
      <View style={styles.button}>
        {children}
      </View>
    </Touchable>
  );
};
```

**Flutter:**

```dart
Platform.isIOS
    ? CupertinoButton(
        color: AppColors.primary,
        onPressed: _handlePress,
        child: Text('Action'),
      )
    : ElevatedButton(
        onPressed: _handlePress,
        child: Text('Action'),
      )
```

### Pickers

**iOS:** Wheel picker
**Android:** Dropdown menu

**React Native:**

```javascript
import { Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // iOS wheel
// Use react-native-modal-dropdown for Android

{Platform.OS === 'ios' ? (
  <Picker selectedValue={value} onValueChange={setValue}>
    <Picker.Item label="Option 1" value="1" />
  </Picker>
) : (
  <ModalDropdown options={['Option 1', 'Option 2']} />
)}
```

**Flutter:**

```dart
Platform.isIOS
    ? CupertinoPicker(
        itemExtent: 32,
        onSelectedItemChanged: (index) {},
        children: options.map((o) => Text(o)).toList(),
      )
    : DropdownButton(
        value: selectedValue,
        items: options.map((o) => DropdownMenuItem(child: Text(o))).toList(),
        onChanged: (value) {},
      )
```

---

## 4. Touch Targets & Accessibility

### Minimum Touch Targets

- **iOS:** 44x44 logical pixels
- **Android:** 48x48 logical pixels

**React Native:**

```javascript
const styles = StyleSheet.create({
  touchTarget: {
    minWidth: Platform.OS === 'ios' ? 44 : 48,
    minHeight: Platform.OS === 'ios' ? 44 : 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

**Flutter:**

```dart
Container(
  constraints: BoxConstraints(
    minWidth: Platform.isIOS ? 44.0 : 48.0,
    minHeight: Platform.isIOS ? 44.0 : 48.0,
  ),
  child: IconButton(...),
)
```

### Screen Reader Support

**React Native:**

```javascript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add item"
  accessibilityRole="button"
>
  <Icon name="plus" />
</TouchableOpacity>
```

**Flutter:**

```dart
Semantics(
  label: 'Add item',
  button: true,
  child: IconButton(
    icon: Icon(Icons.add),
    onPressed: _handleAdd,
  ),
)
```

---

## 5. Dark Mode Support

**React Native:**

```javascript
import { useColorScheme, Appearance } from 'react-native';

function ThemedView({ children }) {
  const colorScheme = useColorScheme(); // 'light' or 'dark'

  const backgroundColor = colorScheme === 'dark'
    ? colors.surfaceDark
    : colors.surface;

  const textColor = colorScheme === 'dark'
    ? colors.onSurfaceDark
    : colors.onSurface;

  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: textColor }}>{children}</Text>
    </View>
  );
}
```

**Flutter:**

```dart
MaterialApp(
  theme: ThemeData(
    brightness: Brightness.light,
    colorScheme: ColorScheme.light(
      primary: AppColors.primary,
      surface: AppColors.surface,
    ),
  ),
  darkTheme: ThemeData(
    brightness: Brightness.dark,
    colorScheme: ColorScheme.dark(
      primary: AppColors.primaryDark,
      surface: AppColors.surfaceDark,
    ),
  ),
  themeMode: ThemeMode.system, // Follows system setting
)
```

---

## 6. Common Pitfalls

| Issue | Fix |
|-------|-----|
| Using same navigation on both platforms | Platform-detect: iOS tab bar vs Android bottom nav |
| FAB on iOS | Only show FAB on Android (`Platform.OS === 'android'`) |
| Different typography sizes | Use shared scale (11/12/13/15/16/17/20/22/28/34) |
| Hardcoding touch targets to 44 | iOS: 44, Android: 48 (platform-specific) |
| Using platform-specific icons | Use cross-platform icon library (react-native-vector-icons, Flutter Icons) |
| Not supporting dark mode | Always implement light + dark variants with shared colors |
| Breaking platform gestures | Don't override iOS swipe-back or Android system back |

---

## 7. Testing Requirements

### Device Testing

**React Native:**
- iOS Simulator (iPhone 15 Pro)
- Android Emulator (Pixel 7)
- Both portrait and landscape

**Flutter:**
- iOS Simulator (iPhone 15 Pro)
- Android Emulator (Pixel 7)
- Test hot reload for rapid iteration

### Platform-Specific Tests

- **iOS:** Test swipe-back gesture, safe area insets, Dynamic Type
- **Android:** Test system back button, edge-to-edge display, font scaling
- **Both:** Test dark mode, screen readers (VoiceOver/TalkBack)

---

## 8. Review Checklist

Before submitting cross-platform mobile design:

### Shared Visual Identity
- [ ] Typography uses shared scale (11/12/13/15/16/17/20/22/28/34)
- [ ] Spacing uses shared scale (4/8/12/16/20/24/32/48)
- [ ] Colors use shared Antigravity palette
- [ ] Corner radius uses shared scale (4/8/10/12/16)

### Platform-Specific Patterns
- [ ] iOS uses tab bar at bottom, Android uses bottom navigation
- [ ] Android shows FAB for primary action, iOS uses navbar button
- [ ] Touch targets: iOS 44x44, Android 48x48
- [ ] iOS respects swipe-back gesture
- [ ] Android respects system back button

### Accessibility
- [ ] Screen reader labels on all interactive elements
- [ ] Font scaling supported (React Native: allowFontScaling, Flutter: textScaleFactor)
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Dark mode supported with shared color palette

---

**For native platform details:**
- **iOS-specific patterns:** See [design-mobile-ios.md](design-mobile-ios.md)
- **Android-specific patterns:** See [design-mobile-android.md](design-mobile-android.md)
