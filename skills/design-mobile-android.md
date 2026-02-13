# Android Native App Design

> Inherits all rules from design-core.md. This guide covers Android native apps (Jetpack Compose, XML Views) following Material Design 3 with Antigravity polish.

---

## 🎯 Core Philosophy

> **Platform conventions for structure, Antigravity for polish**
>
> - **Respect Material Design 3:** Use system navigation patterns (bottom nav, nav drawer), FAB placement, Material components
> - **Apply premium aesthetics:** Shared visual identity with iOS (colors, spacing, sizing), refined typography, smooth motion
> - **Structure = Platform, Polish = Antigravity:** Users expect Material Design patterns. Surprise them with visual excellence, not unfamiliar navigation.

**Critical Principle:** Android and iOS share **visual identity** (colors, spacing, sizing, typography) but differ in **interaction patterns** (navigation, gestures, component behaviors).

---

## Design Paradigm: Shared Brand + Material Patterns

Android apps must feel **unmistakably Material** (platform conventions for structure) while maintaining **visual consistency with iOS** (shared brand identity).

**What's Shared Across Platforms:**
- Color palette (Antigravity brand colors)
- Spacing scale (4/8/12/16/20/24/32/48)
- Typography scale (sizes, weights)
- Border radius scale (4/8/10/12/16)
- Animation timing (150ms, 300ms, 400ms)

**What's Platform-Specific:**
- Navigation patterns (bottom nav vs tab bar)
- Interaction gestures (swipe behaviors)
- Component shapes (Material vs iOS styles)
- System integration (Material You, Dynamic Island)

---

## 1. Shared Design Tokens

### Unit Equivalence

**1dp (Android) = 1pt (iOS)** for our token scale.

Both are density-independent units that scale with screen resolution. Our design system uses the same numeric values across platforms.

### Spacing Scale (Shared with iOS)

**Semantic Token Naming:**

| Semantic Name | Value (dp) | iOS Equivalent | Usage |
|---------------|------------|----------------|-------|
| `spacing-xs` | 4dp | 4pt | Tight gaps, icon-text spacing |
| `spacing-s` | 8dp | 8pt | Compact padding |
| `spacing-m` | 12dp | 12pt | Component padding |
| `spacing-base` | 16dp | 16pt | Standard spacing (Android/iOS default) |
| `spacing-l` | 20dp | 20pt | Generous padding |
| `spacing-xl` | 24dp | 24pt | Section spacing |
| `spacing-2xl` | 32dp | 32pt | Large section dividers |
| `spacing-3xl` | 48dp | 48pt | Major section spacing |

**Raw Values (for reference):**
- 4dp, 8dp, 12dp, 16dp, 20dp, 24dp, 32dp, 48dp

**What is dp?** Density-independent pixels. 1dp = 1 logical unit that scales with device density (functionally equivalent to iOS pt).

**System Bars & Navigation:**

- **Status Bar:** Top of screen, shows time/battery/notifications
- **Navigation Bar:** Bottom (gesture or 3-button), system-managed
- **System Insets:** Use WindowInsets API to respect system bars

**Rule:** Always respect system window insets (similar to iOS safe area).

**Jetpack Compose:**
```kotlin
Scaffold(
    modifier = Modifier.fillMaxSize()
) { innerPadding ->
    // Content automatically respects system insets
    Content(modifier = Modifier.padding(innerPadding))
}
```

### Typography Scale (Shared with iOS)

**Antigravity Shared Type Scale:**

Our app uses a shared typographic scale across iOS and Android. The sizes are identical; only the platform implementation differs.

| Semantic Token | Size (sp/pt) | Weight | iOS Equivalent | Usage |
|----------------|--------------|--------|----------------|-------|
| `display-large` | 34sp | Bold (700) | .largeTitle | Hero text, onboarding |
| `display-medium` | 28sp | Bold (700) | .title | Large headers |
| `headline-large` | 22sp | Semibold (600) | .title2 | Section headers |
| `headline-medium` | 20sp | Semibold (600) | .title3 | Card titles |
| `title-large` | 17sp | Semibold (600) | .headline | List headers, emphasized text |
| `body-large` | 16sp | Regular (400) | .body | Body text (large) |
| `body-medium` | 15sp | Regular (400) | .callout | Body text (standard) |
| `body-small` | 13sp | Regular (400) | .subheadline | Secondary text |
| `label-large` | 12sp | Medium (500) | .footnote | Button text, labels |
| `label-small` | 11sp | Medium (500) | .caption | Smallest labels, metadata |

**What is sp?** Scale-independent pixels. Font sizes use `sp` (not `dp`) to respect the user's system font size settings. This ensures accessibility when users increase font size in system settings.

**Font Families:**

- **Android:** Roboto (system default) OR custom brand font
- **iOS:** San Francisco (system default) OR same custom brand font
- **Recommendation:** If using custom font, use same family on both platforms for maximum visual consistency

**Font Scaling (Accessibility):**

All text MUST scale with user's font size preference (similar to iOS Dynamic Type).

**Implementation: Define Custom Typography**

```kotlin
// In your Theme.kt
val AntigravityTypography = Typography(
    displayLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 34.sp),
    displayMedium = TextStyle(fontWeight = FontWeight.Bold, fontSize = 28.sp),
    headlineLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 22.sp),
    headlineMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 20.sp),
    titleLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 17.sp),
    bodyLarge = TextStyle(fontWeight = FontWeight.Normal, fontSize = 16.sp),
    bodyMedium = TextStyle(fontWeight = FontWeight.Normal, fontSize = 15.sp),
    bodySmall = TextStyle(fontWeight = FontWeight.Normal, fontSize = 13.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.Medium, fontSize = 12.sp),
    labelSmall = TextStyle(fontWeight = FontWeight.Medium, fontSize = 11.sp)
)
```

**✅ CORRECT:** Use MaterialTheme typography
```kotlin
Text(
    text = "Welcome",
    style = MaterialTheme.typography.headlineMedium // Semantic + shared scale
)
```

**❌ WRONG:** Direct fontSize (breaks theming)
```kotlin
Text(
    text = "Welcome",
    fontSize = 20.sp // NEVER - bypasses theme, breaks future updates
)
```

**Rule:** Always use `MaterialTheme.typography.*` styles. This ensures shared typography scale is applied consistently and can be updated in one place.

### Color Tokens (Shared Antigravity Palette)

**Shared Brand Colors:**

Instead of using Material You's wallpaper-based dynamic colors, our app uses a **shared Antigravity brand palette** across iOS and Android.

**Primary Palette:**

| Role | Light Mode | Dark Mode | Usage |
|------|------------|-----------|-------|
| `primary` | #0891B2 (Cyan 600) | #06B6D4 (Cyan 500) | Primary actions, brand color |
| `primaryContainer` | #E0F2FE (Cyan 100) | #164E63 (Cyan 900) | Tonal buttons, backgrounds |
| `secondary` | #6366F1 (Indigo 500) | #818CF8 (Indigo 400) | Secondary actions |
| `secondaryContainer` | #E0E7FF (Indigo 100) | #3730A3 (Indigo 800) | Tonal backgrounds |
| `tertiary` | #F59E0B (Amber 500) | #FCD34D (Amber 300) | Accents, highlights |

**Neutral Palette:**

| Role | Light Mode | Dark Mode | Usage |
|------|------------|-----------|-------|
| `surface` | #FFFFFF | #121212 | Card backgrounds |
| `surfaceVariant` | #F3F4F6 (Gray 100) | #1F2937 (Gray 800) | Subtle backgrounds |
| `onSurface` | #111827 (Gray 900) | #F9FAFB (Gray 50) | Text on surface |
| `onSurfaceVariant` | #6B7280 (Gray 500) | #9CA3AF (Gray 400) | Secondary text |
| `outline` | #D1D5DB (Gray 300) | #4B5563 (Gray 600) | Borders, dividers |

**Semantic Colors:**

| Role | Light Mode | Dark Mode | Usage |
|------|------------|-----------|-------|
| `error` | #DC2626 (Red 600) | #F87171 (Red 400) | Error states |
| `success` | #059669 (Emerald 600) | #34D399 (Emerald 400) | Success states |
| `warning` | #D97706 (Amber 600) | #FBBF24 (Amber 400) | Warning states |
| `info` | #2563EB (Blue 600) | #60A5FA (Blue 400) | Info states |

**Jetpack Compose Implementation:**

```kotlin
// Define custom Antigravity color scheme
private val AntigravityLightColors = lightColorScheme(
    primary = Color(0xFF0891B2),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE0F2FE),
    onPrimaryContainer = Color(0xFF164E63),
    secondary = Color(0xFF6366F1),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE0E7FF),
    tertiary = Color(0xFFF59E0B),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF111827),
    surfaceVariant = Color(0xFFF3F4F6),
    onSurfaceVariant = Color(0xFF6B7280),
    outline = Color(0xFFD1D5DB),
    error = Color(0xFFDC2626)
)

private val AntigravityDarkColors = darkColorScheme(
    primary = Color(0xFF06B6D4), // Light Cyan
    onPrimary = Color(0xFF001F25), // Very Dark Cyan (WCAG AA contrast)
    primaryContainer = Color(0xFF164E63),
    onPrimaryContainer = Color(0xFFE0F2FE),
    secondary = Color(0xFF818CF8), // Light Indigo
    onSecondary = Color(0xFF1A183E), // Very Dark Indigo (WCAG AA contrast)
    secondaryContainer = Color(0xFF3730A3),
    tertiary = Color(0xFFFCD34D),
    surface = Color(0xFF121212),
    onSurface = Color(0xFFF9FAFB),
    surfaceVariant = Color(0xFF1F2937),
    onSurfaceVariant = Color(0xFF9CA3AF),
    outline = Color(0xFF4B5563),
    error = Color(0xFFF87171),
    surfaceTint = Color(0xFF06B6D4) // Tints elevated surfaces in dark theme
)

@Composable
fun AntigravityTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) AntigravityDarkColors else AntigravityLightColors

    MaterialTheme(
        colorScheme = colors,
        typography = AntigravityTypography, // Shared typography scale
        shapes = AntigravityShapes,         // Shared corner radius scale
        content = content
    )
}
```

**Surface Tint Color (M3 Tonal Elevation):**

In Material 3 dark theme, elevated surfaces (cards, dialogs) receive a semi-transparent overlay of `surfaceTintColor` (defaults to `primary`). This makes elevated surfaces appear slightly lighter and tinted with your brand color.

**Our Approach:** We set `surfaceTint = primary` (cyan) to maintain brand identity on elevated surfaces in dark theme.

```kotlin
// Example: Elevated card in dark theme
Card(
    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
) {
    // Surface will have subtle cyan tint in dark mode
}
```

**⚠️ CRITICAL Color Warning:**

**❌ NEVER use `Color.Black` or `Color.White` directly**
- `Color.Black` on dark theme = invisible
- `Color.White` on light theme = invisible

**✅ ALWAYS use semantic color roles:**
- `MaterialTheme.colorScheme.onSurface` instead of `Color.Black`
- `MaterialTheme.colorScheme.surface` instead of `Color.White`

**Accessibility:** All colors MUST pass WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI) in BOTH light and dark themes.

### Corner Radius (Shared with iOS)

**Antigravity Shared Radius Scale:**

| Token | Radius (dp/pt) | Usage | iOS Equivalent |
|-------|----------------|-------|----------------|
| `radius-xs` | 4dp | Small chips, badges | 4pt |
| `radius-s` | 8dp | Buttons, input fields | 8pt |
| `radius-m` | 10dp | Cards (Antigravity default) | 10pt |
| `radius-l` | 12dp | Large cards | 12pt |
| `radius-xl` | 16dp | Prominent cards, dialogs | 16pt |

**Note:** Material Design 3 defaults to 12dp for cards. We use 10dp to match iOS visual consistency.

**Jetpack Compose:**
```kotlin
val AntigravityShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(10.dp), // Antigravity default (not M3's 12dp)
    large = RoundedCornerShape(12.dp),
    extraLarge = RoundedCornerShape(16.dp)
)
```

### Elevation (Material Design 3 Tonal Surface System)

**Material 3 Elevation:**

In Material 3, elevation creates depth using **both shadows and surface color**. In dark theme, higher elevation surfaces receive a semi-transparent "surface tint" overlay of the primary color, making them appear slightly lighter and closer.

**Note:** iOS uses shadow/blur for depth. Android uses shadow + tonal surface color.

**Elevation Levels (z-axis layering):**

| Level | Elevation (dp) | Usage |
|-------|----------------|-------|
| Level 0 | 0dp | Flush with surface |
| Level 1 | 1dp | Cards at rest |
| Level 2 | 3dp | Cards on interaction |
| Level 3 | 6dp | Floating elements (FAB) |
| Level 4 | 8dp | Bottom sheets |
| Level 5 | 12dp | Dialogs, menus |

**Jetpack Compose:**
```kotlin
Card(
    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
) {
    // Content
}
```

### Named Animation Durations (Shared with iOS)

**Antigravity Shared Motion Timing:**

| Duration | Value | Usage | iOS Equivalent |
|----------|-------|-------|----------------|
| `quick` | 150ms | Small elements, instant feedback | 0.15s |
| `default` | 300ms | Standard transitions | 0.3s |
| `gentle` | 400ms | Large movements, complex transitions | 0.4s |

**Material Motion Easing:**

- **Emphasized Decelerate:** Elements entering (fast start, slow end)
- **Emphasized Accelerate:** Elements exiting (slow start, fast end)
- **Standard:** Neutral transitions

**Jetpack Compose:**
```kotlin
// Shared timing with platform-appropriate easing
val quickTransition = tween<Float>(
    durationMillis = 150,
    easing = EmphasizedDecelerate
)

val defaultTransition = tween<Float>(
    durationMillis = 300,
    easing = EmphasizedDecelerate
)

val gentleTransition = tween<Float>(
    durationMillis = 400,
    easing = EmphasizedDecelerate
)
```

---

## 2. Material Design 3 Components

### Button Component Contract

**Material 3 Button Types:**

| Type | Usage | Appearance | Compose |
|------|-------|------------|---------|
| **Filled** | Primary action | Solid background, contrasting text | `Button` |
| **FilledTonal** | Secondary action (prominent) | Tinted background | `FilledTonalButton` |
| **Outlined** | Secondary action | Border, no background | `OutlinedButton` |
| **Text** | Tertiary action | Text only, no background | `TextButton` |

**Sizes (Shared Scale):**

| Size | Height | Horizontal Padding | Touch Target | Usage |
|------|--------|-------------------|--------------|-------|
| Small | 32dp | 12dp | 48x48dp minimum | Inline actions |
| Medium | 40dp | 16dp | 48x48dp minimum | Standard buttons |
| Large | 48dp | 24dp | 48x48dp minimum | Prominent actions |

**⚠️ Touch Target Minimum:** 48x48dp (Material Design requirement). Even if visual button is smaller, touch area MUST be 48x48dp.

**Required States:**

| State | Appearance | Trigger |
|-------|------------|---------|
| **Enabled** | Base appearance | Default state |
| **Disabled** | 38% opacity, no interaction | Button disabled |
| **Pressed** | Ripple effect + 12% overlay | Finger down |
| **Focused** | Outline ring (keyboard nav) | Keyboard focus |

**Material 3 State Layers:**

M3 visualizes interaction states (pressed, hovered, focused) by adding a semi-transparent color overlay (state layer) on top of a component. The overlay color is derived from semantic color roles like `onSurface` or `primary`. This happens automatically when using M3 components like `Button`, `Card`, etc.

**Jetpack Compose Example:**

```kotlin
Button(
    onClick = { /* action */ },
    modifier = Modifier.fillMaxWidth()
) {
    Icon(
        imageVector = Icons.Default.Add,
        contentDescription = null,
        modifier = Modifier.size(18.dp)
    )
    Spacer(modifier = Modifier.width(8.dp))
    Text("Add Item")
}
// Note: M3 Button has intrinsic height that meets 48dp touch target
```

**Do's and Don'ts:**

✅ **DO:** Use verbs for button text ("Save", "Add Photo", "Delete")
✅ **DO:** Make consequences clear ("Delete Project" not just "Delete")
✅ **DO:** Use primary color for main actions
✅ **DO:** Match button sizing with iOS (shared scale)

❌ **DON'T:** Use ambiguous text ("OK", "Submit")
❌ **DON'T:** Create buttons in 5 different colors
❌ **DON'T:** Make touch targets smaller than 48x48dp
❌ **DON'T:** Use different button heights than iOS (breaks visual consistency)

---

### Card Component Contract

**Material 3 Card Types:**

| Type | Elevation | Usage | Compose |
|------|-----------|-------|---------|
| **Filled** | 1dp (default) | Standard cards | `Card` |
| **Elevated** | 1-3dp (shadow) | Prominent cards | `ElevatedCard` |
| **Outlined** | 0dp (border) | Low emphasis | `OutlinedCard` |

**Card Specs (Shared with iOS):**

- **Corner Radius:** `radius-m` (10dp) - matches iOS
- **Padding:** 16dp all sides (standard)
- **Content:** Title, supporting text, optional image, optional actions

**States:**

| State | Appearance |
|-------|------------|
| **Default** | Base appearance |
| **Pressed** | Ripple effect, slight elevation increase (if clickable) |
| **Disabled** | 38% opacity (if interactive) |

**Jetpack Compose Example:**

```kotlin
Card(
    modifier = Modifier
        .fillMaxWidth()
        .clickable { /* action */ },
    shape = RoundedCornerShape(10.dp), // Shared radius
    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
) {
    Column(
        modifier = Modifier.padding(16.dp)
    ) {
        Text(
            text = "Card Title",
            style = MaterialTheme.typography.headlineMedium // Shared scale
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Supporting text description",
            style = MaterialTheme.typography.bodyMedium, // Shared scale
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
```

---

### TextField Component Contract

**Material 3 TextField Types:**

| Type | Usage | Appearance | Compose |
|------|-------|------------|---------|
| **Filled** | Standard input | Filled background, underline | `TextField` |
| **Outlined** | Prominent input | Border, no background fill | `OutlinedTextField` |

**TextField Specs:**

- **Height:** 56dp (single line)
- **Padding:** 16dp horizontal
- **Corner Radius:** `radius-s` (8dp) - **Note:** We override Material 3's default of 4dp to use 8dp for better visual consistency with iOS
- **Label:** Floats above when focused

**Required States:**

| State | Appearance |
|-------|------------|
| **Default** | Neutral colors, label inside |
| **Focused** | Primary color indicator, label floats up |
| **Error** | Error color indicator, error message below |
| **Disabled** | 38% opacity, no interaction |

**Label Behavior:**

- **Empty + Unfocused:** Label inside field
- **Empty + Focused:** Label floats up to top
- **Filled:** Label stays at top (floated)

**Validation:**

- Show errors **on blur** or **on submit** (not on every keystroke)
- Error message: Below field, `label-large` (12sp), error color
- Error messages must be **specific and actionable**

**Jetpack Compose Example:**

```kotlin
var email by remember { mutableStateOf("") }
var isError by remember { mutableStateOf(false) }

OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    label = { Text("Email") },
    isError = isError,
    shape = RoundedCornerShape(8.dp), // Shared radius
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Email
    ),
    supportingText = {
        if (isError) {
            Text("Email address is required")
        }
    },
    modifier = Modifier.fillMaxWidth()
)
```

---

### ListItem Component Contract

**When to use:** Rows in lists, settings screens, navigation menus.

**iOS Equivalent:** List row (similar concept, different styling)

**ListItem Specs:**

| Type | Height | Usage |
|------|--------|-------|
| **Single-line** | 56dp | Title only |
| **Two-line** | 72dp | Title + supporting text |
| **Three-line** | 88dp | Title + 2 lines of supporting text |

**Structure:**

- **Leading Icon:** 24dp icon, 16dp from left edge
- **Headline:** `title-large` (17sp) - matches iOS list headers
- **Supporting Text:** `body-medium` (15sp) - matches iOS body
- **Trailing Icon/Text:** Optional, 16dp from right edge
- **Padding:** 16dp horizontal, 8dp vertical

**Jetpack Compose Example:**

```kotlin
ListItem(
    headlineContent = {
        Text("Project Name", style = MaterialTheme.typography.titleLarge)
    },
    supportingContent = {
        Text("Last updated today", style = MaterialTheme.typography.bodyMedium)
    },
    leadingContent = {
        Icon(
            imageVector = Icons.Default.Folder,
            contentDescription = null
        )
    },
    trailingContent = {
        IconButton(onClick = { /* more */ }) {
            Icon(Icons.Default.MoreVert, contentDescription = "More")
        }
    }
)
```

**Visual Consistency with iOS:**

- Same typography scale (17sp headline = iOS headline)
- Same padding (16dp horizontal = iOS 16pt)
- Different visual treatment (no iOS separator line by default)

---

### Other Material Components

**Chip, Switch, Slider, Checkbox, RadioButton, DatePicker, TimePicker:**

See Material Design 3 component guidelines. Use shared spacing/sizing tokens where applicable:
- Icon sizes: 18-24dp
- Padding: 8dp, 12dp, 16dp (shared scale)
- Corner radius: 4dp (xs), 8dp (s), 12dp (l)
- Touch targets: 48x48dp minimum

---

## 3. Navigation Patterns (Material Design 3)

### Navigation Architecture (Navigation Compose)

**Critical Concept:** Modern Android apps use Navigation Compose to manage screen-to-screen navigation.

**Key Components:**

| Component | Purpose |
|-----------|---------|
| `NavController` | Manages navigation state and back stack |
| `NavHost` | Container for navigation destinations |
| Routes | String identifiers for each screen |

**Basic Setup:**

```kotlin
@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") {
            HomeScreen(
                onNavigateToDetail = { itemId ->
                    navController.navigate("detail/$itemId")
                }
            )
        }

        composable(
            route = "detail/{itemId}",
            arguments = listOf(navArgument("itemId") { type = NavType.StringType })
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getString("itemId")
            DetailScreen(
                itemId = itemId,
                onBack = { navController.navigateUp() }
            )
        }
    }
}
```

**Best Practices:**

✅ **DO:** Use Navigation Compose for all screen navigation
✅ **DO:** Define routes as constants
✅ **DO:** Handle Android system back button

❌ **DON'T:** Build custom navigation solutions
❌ **DON'T:** Hardcode route strings

---

### Bottom Navigation (3-5 Primary Destinations)

**When to use:** App has 3-5 **primary, non-hierarchical** destinations that users switch between frequently.

**Decision Tree:**

- **3-5 primary destinations?** → Use Bottom Navigation
- **>5 destinations OR secondary nav items (Settings, Help, About)?** → Use Navigation Drawer
- **Single primary action (Create, Compose)?** → Use FAB

**Placement:** Bottom of screen (Material Design standard, thumb-reachable).

**iOS Equivalent:** Tab Bar (similar concept, different styling)

**Specs:**

- **Height:** 80dp
- **Items:** 3-5 destinations (same as iOS)
- **Icon Size:** 24dp
- **Label:** 12sp, below icon
- **Active Indicator:** Pill-shaped background on selected item

**Jetpack Compose Example:**

```kotlin
Scaffold(
    bottomBar = {
        NavigationBar {
            items.forEach { item ->
                NavigationBarItem(
                    selected = item == selectedItem,
                    onClick = { selectedItem = item },
                    icon = {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.label
                        )
                    },
                    label = { Text(item.label) }
                )
            }
        }
    }
) { innerPadding ->
    // Content
}
```

**Visual Consistency with iOS:**

- Same number of destinations (3-5)
- Same icon set (Material Icons on Android, SF Symbols on iOS, but same concepts)
- Same placement (bottom, always visible)
- Different styling (Material pill indicator vs iOS solid background)

---

### Top App Bar

**Types:**

| Type | Height | Usage | Compose |
|------|--------|-------|---------|
| **Small** | 64dp | Standard toolbar | `TopAppBar` |
| **Medium** | 112dp | Scrollable title | `MediumTopAppBar` |
| **Large** | 152dp | Hero title | `LargeTopAppBar` |

**Elements:**

- **Navigation Icon:** Left (back arrow, hamburger menu)
- **Title:** Left-aligned (Material default) or centered
- **Actions:** Right side (1-3 icons max)

**Jetpack Compose Example:**

```kotlin
TopAppBar(
    title = { Text("Projects") },
    navigationIcon = {
        IconButton(onClick = { /* back */ }) {
            Icon(Icons.Default.ArrowBack, contentDescription = "Back")
        }
    },
    actions = {
        IconButton(onClick = { /* search */ }) {
            Icon(Icons.Default.Search, contentDescription = "Search")
        }
    }
)
```

---

### Floating Action Button (FAB)

**When to use:** Primary action for the screen (create, compose, add).

**Placement:** Bottom-right corner (Material Design standard).

**iOS Equivalent:** None. iOS uses buttons in tab bar or navigation bar for primary actions.

**Types:**

| Type | Size | Usage |
|------|------|-------|
| **FAB** | 56dp | Standard (most common) |
| **Large FAB** | 96dp | Hero action |
| **Extended FAB** | 56dp height | With text label |

**Specs:**

- **Corner Radius:** `radius-xl` (16dp)
- **Elevation:** 6dp (Level 3)
- **Color:** Primary container

**Jetpack Compose Example:**

```kotlin
Scaffold(
    floatingActionButton = {
        FloatingActionButton(
            onClick = { /* create */ },
            containerColor = MaterialTheme.colorScheme.primaryContainer
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add")
        }
    }
) { innerPadding ->
    // Content
}
```

---

### Navigation Drawer (Side Menu)

**When to use:** App has 5+ top-level sections OR hierarchical navigation.

**iOS Equivalent:** Not standard on iOS. iOS prefers Tab Bar for primary navigation.

**Specs:**

- **Width:** 256dp (mobile), 304dp (tablet)
- **Item Height:** 56dp
- **Swipe from Edge:** Left edge swipe opens drawer

```kotlin
val drawerState = rememberDrawerState(DrawerValue.Closed)

ModalNavigationDrawer(
    drawerState = drawerState,
    drawerContent = {
        ModalDrawerSheet {
            Text("Menu", modifier = Modifier.padding(16.dp))
            Divider()
            items.forEach { item ->
                NavigationDrawerItem(
                    label = { Text(item.label) },
                    selected = item == selectedItem,
                    onClick = {
                        selectedItem = item
                        scope.launch { drawerState.close() }
                    },
                    icon = { Icon(item.icon, contentDescription = null) }
                )
            }
        }
    }
) {
    // Main content
}
```

---

### Dialogs & Bottom Sheets

**Alert Dialog:** Simple decisions (1-3 actions)

```kotlin
AlertDialog(
    onDismissRequest = { showDialog = false },
    title = { Text("Delete Project?") },
    text = { Text("This action cannot be undone.") },
    confirmButton = {
        TextButton(onClick = { /* delete */ }) {
            Text("Delete")
        }
    },
    dismissButton = {
        TextButton(onClick = { showDialog = false }) {
            Text("Cancel")
        }
    }
)
```

**Bottom Sheet:** Contextual actions, forms

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
ModalBottomSheet(
    onDismissRequest = { showSheet = false },
    sheetState = sheetState
) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Options", fontSize = 20.sp)
        Spacer(modifier = Modifier.height(16.dp))
        // Sheet content
    }
}
```

---

## 4. Dialogs & Modals

## 5. Platform-Specific Features

### Pull to Refresh

**Usage:** List with live data that can be refreshed.

**Jetpack Compose:**

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
PullToRefreshBox(
    isRefreshing = isRefreshing,
    onRefresh = { viewModel.refresh() }
) {
    LazyColumn {
        items(items) { item ->
            ItemRow(item)
        }
    }
}
```

**Note:** `PullToRefreshBox` is experimental. Future versions may use `Modifier.pullToRefresh()` instead.

---

### System Permissions

**When to request:** Location, Camera, Contacts, Notifications, Storage

**Best Practice:**

1. **Explain why first:** Show rationale dialog before system prompt
2. **Request at point of use:** Don't ask on app launch
3. **Handle denial gracefully:** Provide alternative or degraded experience

**Pattern:**

```kotlin
// 1. Show rationale
AlertDialog(
    onDismissRequest = { },
    title = { Text("Camera Access Needed") },
    text = { Text("To scan receipts, we need access to your camera.") },
    confirmButton = {
        TextButton(onClick = { /* request permission */ }) {
            Text("Allow")
        }
    }
)

// 2. Request system permission
val launcher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.RequestPermission()
) { isGranted ->
    if (isGranted) {
        // Permission granted
    } else {
        // Permission denied - show alternative
    }
}

// 3. Trigger
launcher.launch(android.Manifest.permission.CAMERA)
```

---

### Other Android-Specific Features

- **Swipe to Dismiss:** Swipe list items left/right to delete (use `SwipeToDismissBox` - experimental API)
- **Snackbar:** Brief messages at bottom (iOS has custom toasts, Android has system Snackbar)
- **Material Motion:** Shared element transitions between screens

---

## 8. Dark Theme

**Requirement:** Dark theme is HIGHLY RECOMMENDED in Material Design 3.

**Visual Consistency:** Use same Antigravity color palette (defined in Color Tokens section).

**Implementation:**

```kotlin
@Composable
fun AntigravityTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) {
        AntigravityDarkColors // Shared palette
    } else {
        AntigravityLightColors // Shared palette
    }

    MaterialTheme(
        colorScheme = colors,
        content = content
    )
}
```

**Surface Elevation in Dark Theme:**

Material Design 3 uses tonal elevation:
- **Level 0:** #121212 (base surface)
- **Higher elevation = lighter surface** (primary color tint)

---

## 6. Icons

### Material Symbols (Recommended for M3)

**Source:** Material Symbols library (2000+ icons)

**Style:** Outlined (Material 3 default) or Filled

**iOS Equivalent:** SF Symbols (similar role, different library)

**Standard Sizes:**

| Size | Usage | Context |
|------|-------|---------|
| 18dp | Inline icons (buttons, chips) | Small UI elements |
| 20dp | List icons, form icons | Medium UI elements |
| 24dp | Navigation icons, toolbar | Standard (most common) |

**Jetpack Compose:**

```kotlin
Icon(
    imageVector = Icons.Default.Home, // Material Symbols
    contentDescription = "Home",
    modifier = Modifier.size(24.dp) // Standard size
)

Icon(
    imageVector = Icons.Outlined.Favorite, // Outlined style (M3 default)
    contentDescription = "Favorite"
)
```

**Custom Icons:**

If using custom icon pack:
- **Format:** Vector drawables (SVG)
- **Location:** `res/drawable/`
- **Recommendation:** Use same icon set concept across iOS (SF Symbols) and Android (Material Symbols) for visual parity

**Visual Consistency:**

- Same icon concepts (home, search, profile) across platforms
- Platform-specific icon libraries (SF Symbols on iOS, Material Symbols on Android)
- Same sizing scale (18/20/24 maps to iOS 18/20/24pt)

---

## 7. Accessibility

### Font Scaling

All text MUST scale with user's font size preference.

**✅ CORRECT:**
```kotlin
Text(
    text = "Welcome",
    fontSize = 20.sp // Shared scale value
)
```

**❌ WRONG:**
```kotlin
Text(
    text = "Welcome",
    fontSize = 28.sp // Random value - breaks shared scale
)
```

### TalkBack (Screen Reader)

All interactive elements must have content descriptions.

```kotlin
IconButton(onClick = { addItem() }) {
    Icon(
        imageVector = Icons.Default.Add,
        contentDescription = "Add item" // REQUIRED
    )
}
```

### Touch Targets

**Minimum:** 48x48dp for ALL interactive elements.

### Color Contrast (WCAG AA)

- **Text:** 4.5:1 contrast ratio
- **UI Components:** 3:1 contrast ratio
- **Test in BOTH light and dark themes**

---

## 9. Review Checklist

Before submitting Android design:

### Visual Consistency with iOS
- [ ] Colors match iOS (shared Antigravity palette)
- [ ] Spacing matches iOS (4/8/12/16/20/24/32/48)
- [ ] Typography sizes match iOS (11/12/13/15/16/17/20/22/28/34)
- [ ] Corner radius matches iOS (4/8/10/12/16)
- [ ] Animation timing matches iOS (150ms/300ms/400ms)

### Material Design 3 Platform Conventions
- [ ] Bottom navigation OR navigation drawer (not both)
- [ ] FAB positioned bottom-right (if used)
- [ ] Top app bar with navigation icon
- [ ] System bars respected (windowInsets)
- [ ] Touch targets 48x48dp minimum
- [ ] Ripple effects on interactive elements

### Dark Theme
- [ ] All screens tested in dark theme
- [ ] Shared color palette used (not Material default)
- [ ] Surfaces use proper elevation for depth

### Accessibility
- [ ] Text uses shared typography scale (font scaling works)
- [ ] Content descriptions on all interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets 48x48dp verified

---

## 10. Common Android Mistakes

1. **Using iOS patterns on Android** — Tab bar with text-only labels is iOS. Android uses bottom navigation with icons+labels OR FAB.
2. **FAB in wrong position** — FAB must be bottom-right, not center or top.
3. **Ignoring system bars** — Not using windowInsets causes content overlap.
4. **Breaking shared visual identity** — Using Material default colors instead of shared Antigravity palette.
5. **Different spacing than iOS** — Using 14dp instead of 16dp breaks visual consistency.
6. **Only testing light theme** — Dark theme is Material 3 default, must test both.
7. **Tiny touch targets** — < 48dp is unusable.
8. **Using Color.Black/Color.White directly** — Breaks theme adaptation.
9. **No ripple effects** — Material Design signature feedback missing.
10. **Arbitrary font sizes** — Not using shared typography scale (breaks iOS parity).

---

## 11. Cross-Platform Considerations

**What's Different from iOS:**

| Feature | Android | iOS |
|---------|---------|-----|
| **Primary Nav** | Bottom Navigation (icons+labels) | Tab Bar (icons only or icons+text) |
| **Primary Action** | FAB (bottom-right) | Button in tab bar or nav bar |
| **Side Menu** | Navigation Drawer (common) | Not standard pattern |
| **Back Navigation** | System back button/gesture (universal) | In-app back button (per-screen) |
| **Feedback** | Ripple effect | Highlight/scale effect |
| **Elevation** | Shadow + tonal surface color | Shadow/blur only |

**What's Shared:**

- Colors (Antigravity palette)
- Spacing (4/8/12/16/20/24/32/48)
- Typography sizes (11/12/13/15/16/17/20/22/28/34)
- Corner radius (4/8/10/12/16)
- Animation timing (150ms/300ms/400ms)

---

## 12. References

| Resource | Link |
|----------|------|
| **Material Design 3** | https://m3.material.io/ |
| **Material Icons** | https://fonts.google.com/icons |
| **Jetpack Compose** | https://developer.android.com/jetpack/compose |
| **Navigation Compose** | https://developer.android.com/jetpack/compose/navigation |

---

**For iOS patterns:** See `design-mobile-ios.md`
**For cross-platform (React Native/Flutter):** See `design-mobile-crossplatform.md` (coming in Priority 3)
