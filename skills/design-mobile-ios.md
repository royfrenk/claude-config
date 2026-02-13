# iOS Native App Design

> Inherits all rules from [design-core.md](design-core.md). This guide covers iOS native apps (UIKit, SwiftUI) following Apple Human Interface Guidelines with Antigravity polish.

**See Also:**
- **[Design Core](design-core.md)** - Shared design principles, unified typography scale, spacing scale, color guidance
- **[Android Native Patterns](design-mobile-android.md)** - Material Design 3 implementation of shared visual identity
- **[Cross-Platform Mobile](design-mobile-crossplatform.md)** - React Native, Flutter, Expo guidance

---

## 🎯 Core Philosophy

> **Platform conventions for structure, Antigravity for polish**
>
> - **Respect iOS HIG:** Use system navigation patterns (tab bars, nav bars), standard transitions, native gestures
> - **Apply premium aesthetics:** Custom colors, refined typography, smooth micro-animations, haptic feedback
> - **Structure = Platform, Polish = Antigravity:** Users expect iOS patterns. Surprise them with visual excellence, not unfamiliar navigation.

---

## Design Paradigm: Native + Premium

iOS apps must feel **unmistakably native** (platform conventions for structure) while achieving **premium visual excellence** (Antigravity for polish).

**Core principle:** Users expect iOS patterns. Surprise them with polish, not with unfamiliar navigation.

---

## 1. iOS Design Tokens

### Spacing Scale (iOS uses points, not pixels)

**Semantic Token Naming:**

| Semantic Name | Value (pt) | Usage |
|---------------|------------|-------|
| `spacing-xs` | 4pt | Tight gaps, icon-text spacing |
| `spacing-s` | 8pt | Compact padding |
| `spacing-m` | 16pt | Component padding (iOS standard) |
| `spacing-l` | 24pt | Section spacing |
| `spacing-xl` | 32pt | Large section dividers |
| `spacing-2xl` | 48pt | Major section spacing |

**Raw Values (for reference):**
- 0pt, 4pt, 8pt, 12pt, 16pt, 20pt, 24pt, 32pt, 48pt (4pt base grid)

**Safe Area Insets:**

**⚠️ CRITICAL:** Never hardcode safe area values. They vary by device, orientation, and can change with future iOS releases.

- Top: Dynamic (notch size varies by iPhone model, different on iPad)
- Bottom: Dynamic (34pt on iPhones with home indicator in portrait, 0pt on iPhones with home button, changes in landscape)
- Sides: 0pt (portrait), dynamic (landscape on notched devices)

**Rule:** Always use system-provided safe area insets.
- SwiftUI: Use `.safeAreaInset(edge:)` or let framework manage padding by default
- UIKit: Use `safeAreaLayoutGuide`
- **Never** hardcode padding like `padding(.bottom, 34)` to avoid home indicator

### Typography Scale (Shared Across Platforms)

**Antigravity Shared Type Scale:**

Our design system uses a **shared numeric scale** across web, iOS, and Android to ensure visual consistency. On iOS, we implement custom font extensions that use the shared scale while maintaining Dynamic Type support.

| Semantic Token | Size (pt) | Weight | Web/Android Equivalent | Usage |
|----------------|-----------|--------|------------------------|-------|
| `caption` | 11pt | Regular | 11px/11sp | Smallest labels, metadata |
| `footnote` | 12pt | Regular | 12px/12sp | Small labels, badges |
| `subheadline` | 13pt | Regular | 13px/13sp | Secondary body text |
| `callout` | 15pt | Regular | 15px/15sp | Emphasized body text |
| `body` | 16pt | Regular | 16px/16sp | Default body text (primary) |
| `headline` | 17pt | Semibold | 17px/17sp | List headers, emphasized text |
| `title3` | 20pt | Semibold | 20px/20sp | Card titles, section headers |
| `title2` | 22pt | Semibold | 22px/22sp | Page section headers |
| `title` | 28pt | Bold | 28px/28sp | Large headers |
| `largeTitle` | 34pt | Bold | 34px/34sp | Hero text, onboarding |

**Platform Unit Equivalence:** **1pt (iOS) = 1px (web) = 1sp (Android)** for our token system.

**Font:** SF Pro (system font). For brand consistency, you can use a custom font, but you'll need to implement Dynamic Type manually.

**Implementation: Custom Font Extension**

```swift
extension Font {
    // Antigravity shared scale with Dynamic Type support
    static let caption = Font.system(size: 11).relativeTo(.caption2)
    static let footnote = Font.system(size: 12).relativeTo(.caption)
    static let subheadline = Font.system(size: 13).relativeTo(.footnote)
    static let callout = Font.system(size: 15).relativeTo(.subheadline)
    static let body = Font.system(size: 16).relativeTo(.callout)
    static let headline = Font.system(size: 17, weight: .semibold).relativeTo(.headline)
    static let title3 = Font.system(size: 20, weight: .semibold).relativeTo(.title3)
    static let title2 = Font.system(size: 22, weight: .semibold).relativeTo(.title2)
    static let title = Font.system(size: 28, weight: .bold).relativeTo(.title)
    static let largeTitle = Font.system(size: 34, weight: .bold).relativeTo(.largeTitle)
}
```

**Dynamic Type (CRITICAL):**

All text MUST support Dynamic Type for App Store approval and accessibility compliance. Our custom font extensions use `.relativeTo()` to maintain Dynamic Type support with the shared scale.

**✅ CORRECT:** Use shared scale with Dynamic Type
```swift
Text("Welcome")
    .font(.headline)  // Shared 17pt, scales with user preference

Text("Description")
    .font(.body)  // Shared 16pt, scales automatically
```

**❌ WRONG:** Hardcoded font sizes without Dynamic Type
```swift
Text("Welcome")
    .font(.system(size: 17))  // NEVER - breaks Dynamic Type
```

**❌ WRONG:** Using Apple's default semantic styles directly (breaks shared scale)
```swift
Text("Description")
    .font(Font.body)  // Apple's .body is 17pt, our shared scale is 16pt
```

**Rule:** Always use our custom `Font` extensions (e.g., `Font.headline`, `Font.caption`) defined above. These maintain the shared scale (11/12/13/15/16/17/20/22/28/34pt) while supporting Dynamic Type through `.relativeTo()`.

### Color Tokens (iOS Semantic Colors)

**System Semantic Colors (Auto-adapt to light/dark mode):**

**Backgrounds:**
- `systemBackground` → `Color(.systemBackground)` (white light, black dark)
- `secondarySystemBackground` → `Color(.secondarySystemBackground)` (gray light, dark gray dark)
- `tertiarySystemBackground` → `Color(.tertiarySystemBackground)` (lighter gray light, darker gray dark)

**Text:**
- `label` → `Color(.label)` (black light, white dark)
- `secondaryLabel` → `Color(.secondaryLabel)` (gray light, light gray dark)
- `tertiaryLabel` → `Color(.tertiaryLabel)` (lighter gray)

**System Colors:**
- `.blue`, `.green`, `.red`, `.orange`, `.yellow`, `.purple`, `.pink`, `.teal`, `.indigo`

**Antigravity Custom Colors (Shared Palette):**

Instead of using iOS system colors alone, we define a **shared Antigravity brand palette** that matches Android and web for cross-platform visual consistency.

```swift
// Define custom colors in Color+Antigravity.swift
extension Color {
    // Primary Palette (Shared with Android/Web)
    static let primaryLight = Color(hex: "#0891B2")      // Cyan 600
    static let primaryDark = Color(hex: "#06B6D4")       // Cyan 500
    static let primaryContainerLight = Color(hex: "#E0F2FE") // Cyan 100
    static let primaryContainerDark = Color(hex: "#164E63")  // Cyan 900

    // Secondary Palette
    static let secondaryLight = Color(hex: "#6366F1")    // Indigo 500
    static let secondaryDark = Color(hex: "#818CF8")     // Indigo 400
    static let secondaryContainerLight = Color(hex: "#E0E7FF") // Indigo 100
    static let secondaryContainerDark = Color(hex: "#3730A3")  // Indigo 800

    // Tertiary Palette
    static let tertiaryLight = Color(hex: "#F59E0B")     // Amber 500
    static let tertiaryDark = Color(hex: "#FCD34D")      // Amber 300

    // Neutral Palette
    static let surfaceLight = Color(hex: "#FFFFFF")
    static let surfaceDark = Color(hex: "#121212")
    static let surfaceVariantLight = Color(hex: "#F3F4F6") // Gray 100
    static let surfaceVariantDark = Color(hex: "#1F2937")  // Gray 800

    static let onSurfaceLight = Color(hex: "#111827")    // Gray 900
    static let onSurfaceDark = Color(hex: "#F9FAFB")     // Gray 50
    static let onSurfaceVariantLight = Color(hex: "#6B7280") // Gray 500
    static let onSurfaceVariantDark = Color(hex: "#9CA3AF")  // Gray 400

    static let outlineLight = Color(hex: "#D1D5DB")      // Gray 300
    static let outlineDark = Color(hex: "#4B5563")       // Gray 600

    // Semantic Colors
    static let errorLight = Color(hex: "#DC2626")        // Red 600
    static let errorDark = Color(hex: "#F87171")         // Red 400
    static let successLight = Color(hex: "#059669")      // Emerald 600
    static let successDark = Color(hex: "#34D399")       // Emerald 400
    static let warningLight = Color(hex: "#D97706")      // Amber 600
    static let warningDark = Color(hex: "#FBBF24")       // Amber 400

    // Convenience initializer for hex colors
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: // RGB
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// Usage in views:
struct ContentView: View {
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        VStack {
            Text("Welcome")
                .foregroundColor(colorScheme == .dark ? .onSurfaceDark : .onSurfaceLight)

            Button("Primary Action") {
                // Action
            }
            .foregroundColor(.white)
            .background(colorScheme == .dark ? Color.primaryDark : Color.primaryLight)
        }
        .background(colorScheme == .dark ? Color.surfaceDark : Color.surfaceLight)
    }
}
```

**Asset Catalog Setup (Recommended for Automatic Dark Mode):**

For cleaner code, define colors in Assets.xcassets:

1. Create new Color Set in Assets.xcassets: "Primary"
2. Set "Any Appearance" to #0891B2 (light mode)
3. Set "Dark Appearance" to #06B6D4 (dark mode)
4. Use in code: `Color("Primary")`

**Repeat for all colors above, then use:**

```swift
Text("Welcome")
    .foregroundColor(Color("OnSurface"))  // Auto-adapts to dark mode

Button("Action") { }
    .background(Color("Primary"))  // Auto-adapts to dark mode
```

**⚠️ CRITICAL Color Warning:**

**❌ NEVER use `Color.black` or `Color.white`**
- `Color.black` on dark mode = invisible
- `Color.white` on light mode = invisible

**✅ ALWAYS use semantic colors:**
- `Color(.label)` instead of `Color.black`
- `Color(.systemBackground)` instead of `Color.white`

**Accessibility:** All custom colors MUST pass WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI) in BOTH light and dark mode.

### Border Radius (iOS favors subtle rounding)

**Semantic Radius Tokens:**

| Semantic Name | Value | Usage |
|---------------|-------|-------|
| `cornerRadius-small` | 4pt | Small badges, tags |
| `cornerRadius-medium` | 8pt | Buttons, input fields (iOS standard) |
| `cornerRadius-large` | 12pt | Cards, containers |
| `cornerRadius-xl` | 16pt | Large cards, modals |
| `cornerRadius-full` | 50% | Circular avatars, badges |

**iOS convention:** Corner radius of 8-10pt is standard. Don't use sharp corners (looks Android).

### Named Animation Curves (Antigravity Standard)

```swift
extension Animation {
    /// Quick, snappy animation for button presses
    static let antigravityQuick = Animation.spring(response: 0.2, dampingFraction: 0.7)

    /// Default animation for view transitions
    static let antigravityDefault = Animation.spring(response: 0.3, dampingFraction: 0.7)

    /// Gentle, smooth animation for large movements
    static let antigravityGentle = Animation.spring(response: 0.5, dampingFraction: 0.8)
}

// Usage
withAnimation(.antigravityDefault) {
    isExpanded.toggle()
}
```

---

## 2. Foundations: Components

### Button Component Contract

**Styles:**

| Style | Usage | Appearance | Code |
|-------|-------|------------|------|
| **Filled** | Primary action | Solid background, white text | `.buttonStyle(.borderedProminent)` |
| **Tinted** | Secondary action | Light tint background, colored text | `.buttonStyle(.bordered)` |
| **Plain** | Tertiary action | No background, colored text | `.buttonStyle(.plain)` |
| **Bordered** | Outlined button | Border, colored text, transparent bg | `.buttonStyle(.bordered)` |

**Sizes:**

| Size | Height | Horizontal Padding | Touch Target | Code |
|------|--------|-------------------|--------------|------|
| Small | 28pt | 8pt | 44x44pt minimum | `.controlSize(.small)` |
| Medium | 44pt | 16pt | 44x44pt | `.controlSize(.regular)` |
| Large | 50pt | 20pt | 50x50pt | `.controlSize(.large)` |

**⚠️ Touch Target Minimum:** 44x44pt (Apple HIG requirement). Even if visual button is smaller, hit area MUST be 44x44pt.

**Required States:**

| State | Appearance | Trigger | Code |
|-------|------------|---------|------|
| **Default** | Base appearance | At rest | N/A |
| **Highlighted** | Opacity 0.6 or scale(0.97) | Finger down on button | Automatic |
| **Disabled** | Opacity 0.4, no interaction | Button is disabled | `.disabled(true)` |
| **Loading** | Spinner inside, width stable | Async action in progress | Custom state |

**Note:** "Hover" state is NOT used on iOS (touch interface). "Focus" is only for external keyboard navigation.

**Haptic Feedback:**
- **Tap:** `.impact(.light)` when button is tapped
- **Success:** `.notification(.success)` when action completes successfully
- **Error:** `.notification(.error)` when action fails

**Antigravity Polish:**
- Smooth scale animation on press: `scale(1.0 → 0.97 → 1.0)` with `.antigravityQuick`
- Add haptic feedback on tap
- Use vibrant accent colors (not just system blue)

**SwiftUI Example:**

```swift
struct AntigravityButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.accentColor)
            .foregroundColor(.white)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.antigravityQuick, value: configuration.isPressed)
    }
}

// Usage
Button("Save") {
    HapticManager.impact(.light)
    save()
}
.buttonStyle(AntigravityButtonStyle())
```

**Do's and Don'ts:**

✅ **DO:** Use verbs for button titles ("Save", "Add Photo", "Delete")
✅ **DO:** Make consequences clear ("Delete Project" not just "Delete")
✅ **DO:** Use accent color for primary actions

❌ **DON'T:** Use ambiguous titles ("OK", "Submit")
❌ **DON'T:** Create buttons in 5 different colors (breaks consistency)
❌ **DON'T:** Make touch targets smaller than 44x44pt

---

### List / Table View Component Contract

**Row Specs:**

- **Height:** 44pt minimum (touch target requirement)
- **Padding:** 16pt horizontal
- **Separator:** 1px, light gray, inset 16pt from left

**Disclosure Indicator:**
- Chevron right (>) icon from SF Symbols
- Color: `.secondaryLabel` (gray)
- Size: 13x20pt (system size)
- Placement: Right edge, vertically centered

**Swipe Actions:**

| Direction | Usage | Color Convention |
|-----------|-------|------------------|
| **Leading** (right swipe) | Positive actions | Green (favorite, mark read, complete) |
| **Trailing** (left swipe) | Destructive actions | Red (delete, remove, archive) |

**Sections:**

- **Header:** 13pt (`.footnote`), gray (`.secondaryLabel`), uppercase, 8pt top padding
- **Footer:** 13pt (`.footnote`), gray, explanatory text, 8pt bottom padding

**Required States:**

| State | Appearance |
|-------|------------|
| **Default** | Base row appearance |
| **Highlighted** | Light gray background on tap |
| **Selected** | Accent color background (if selectable) |
| **Disabled** | Opacity 0.5, no interaction |

**Antigravity Polish:**
- Subtle shadow on card-style lists
- Smooth transitions when adding/removing rows
- Haptic feedback on swipe actions (`.impact(.medium)`)
- Custom separator insets for visual breathing room

**SwiftUI Example:**

```swift
List {
    Section("Recent") {
        ForEach(items) { item in
            HStack {
                Image(systemName: item.icon)
                    .foregroundColor(.accentColor)
                Text(item.title)
                    .font(.body)
                Spacer()
                Text(item.subtitle)
                    .font(.caption)
                    .foregroundColor(.secondaryLabel)
            }
            .padding(.vertical, 4)
        }
        .onDelete(perform: delete)
    }
}
.listStyle(.insetGrouped)
```

**Do's and Don'ts:**

✅ **DO:** Use 44pt minimum row height
✅ **DO:** Add haptic feedback on swipe actions
✅ **DO:** Use SF Symbols for list item icons

❌ **DON'T:** Use rows smaller than 44pt (accessibility issue)
❌ **DON'T:** Put too much information in a single row (keep scannable)
❌ **DON'T:** Use custom separators that differ from system style

---

### Form / Input Field Component Contract

**Text Field:**

- **Height:** 44pt minimum
- **Padding:** 12pt horizontal, 10pt vertical
- **Corner Radius:** `cornerRadius-medium` (8pt)
- **Border:** 1pt, light gray (default), blue (focused), red (error)

**Label:**
- Always ABOVE field (not placeholder-only)
- 17pt (`.body`) or 15pt (`.subheadline`)
- Required fields: asterisk (*) or "(required)" suffix

**Required States:**

| State | Appearance | Border Color |
|-------|------------|--------------|
| **Default** | Neutral appearance | Light gray |
| **Focused** | Accent ring, blue border | Accent color |
| **Error** | Red border, error icon, message below | Red (`systemRed`) |
| **Disabled** | Gray background, no interaction | Gray |

**Validation:**

- Show errors **on blur** or **on submit** (not on every keystroke)
- Error message: Below field, 13pt (`.footnote`), red color
- Error messages must be **specific and actionable**:
  - ✅ "Email address is required"
  - ❌ "Invalid input"

**Keyboard Types:**

Choose appropriate keyboard for input type:
- `.emailAddress` - Email input
- `.numberPad` - Numeric input (no decimals)
- `.decimalPad` - Currency, measurements
- `.phonePad` - Phone numbers
- `.URL` - Web addresses

**Antigravity Polish:**
- Focus ring animation: scale(1.0 → 1.02), blue border with `.antigravityQuick`
- Clear button (X) on right side when field has content
- Smooth keyboard appearance with proper padding adjustment
- Haptic feedback on validation errors (`.notification(.error)`)

**SwiftUI Example:**

```swift
VStack(alignment: .leading, spacing: 4) {
    Text("Email")
        .font(.subheadline)
        .foregroundColor(.secondaryLabel)

    TextField("your@email.com", text: $email)
        .keyboardType(.emailAddress)
        .autocapitalization(.none)
        .textFieldStyle(.roundedBorder)
        .frame(height: 44)

    if let error = emailError {
        HStack(spacing: 4) {
            Image(systemName: "exclamationmark.circle.fill")
            Text(error)
        }
        .font(.footnote)
        .foregroundColor(.red)
    }
}
```

**Do's and Don'ts:**

✅ **DO:** Always show labels above fields
✅ **DO:** Use appropriate keyboard types
✅ **DO:** Provide clear, actionable error messages

❌ **DON'T:** Use placeholder text as the only label
❌ **DON'T:** Validate on every keystroke (annoying for users)
❌ **DON'T:** Show generic error messages ("Invalid input")

---

### Alert Component Contract

**Usage:** System alerts for important decisions, confirmations, or critical errors.

**Structure:**
- **Title:** Bold, centered, 17pt
- **Message:** Regular, centered, 13pt
- **Actions:** 1-3 buttons, vertically stacked (if 3+) or horizontally (if 2)

**Action Styles:**

| Style | Usage | Appearance |
|-------|-------|------------|
| **Default** | Standard action | Blue text |
| **Cancel** | Dismiss without action | Bold, blue text |
| **Destructive** | Irreversible action | Red text |

**Best Practices:**
- Maximum 3 actions (if more, use Action Sheet)
- Default action should be safe/non-destructive
- Destructive actions always in red
- Cancel always present (except for critical confirmations)

**SwiftUI Example:**

```swift
.alert("Delete Project", isPresented: $showingAlert) {
    Button("Cancel", role: .cancel) { }
    Button("Delete", role: .destructive) {
        HapticManager.impact(.medium)
        deleteProject()
    }
} message: {
    Text("This action cannot be undone.")
}
```

---

### Picker Component Contract

**Styles:**

| Style | Usage | Appearance |
|-------|-------|------------|
| **Wheel** | Large set of options | Spinning wheel |
| **Menu** | 5-15 options | Dropdown menu |
| **Segmented** | 2-5 options | Segmented control bar |

**Wheel Picker:**
- Use for dates, times, or large sets of options
- Always show current selection
- Haptic feedback on scroll (`.selection`)

**Menu Picker:**
- Use for moderate number of choices (5-15)
- Shows checkmark next to selected item
- Haptic feedback on selection

**SwiftUI Example:**

```swift
// Menu Picker
Picker("Size", selection: $selectedSize) {
    ForEach(sizes, id: \.self) { size in
        Text(size).tag(size)
    }
}
.pickerStyle(.menu)

// Segmented Control (2-5 options)
Picker("View", selection: $viewMode) {
    Text("List").tag(ViewMode.list)
    Text("Grid").tag(ViewMode.grid)
}
.pickerStyle(.segmented)
```

---

### Toggle (Switch) Component Contract

**Specs:**
- **Size:** 51x31pt (system size)
- **Colors:** Off = gray, On = accent color (green by default)
- **Animation:** Smooth slide transition (`.antigravityDefault`)

**Haptic Feedback:**
- On toggle: `.impact(.light)`

**Usage:**
- Binary choices (on/off, enable/disable)
- Always include a label (don't use toggle alone)
- Use `.toggleStyle(.switch)` for standard iOS appearance

**SwiftUI Example:**

```swift
Toggle("Enable Notifications", isOn: $notificationsEnabled)
    .toggleStyle(.switch)
    .onChange(of: notificationsEnabled) { _ in
        HapticManager.impact(.light)
    }
```

---

### Slider Component Contract

**Specs:**
- **Track Height:** 2pt
- **Thumb Size:** 27x27pt (circular)
- **Colors:** Track = gray, Thumb = accent color

**Usage:**
- Continuous value selection (volume, brightness, percentage)
- Always show current value (label or live preview)
- Min/max labels on sides (optional)

**Haptic Feedback:**
- On value change: `.selection` (every 10% change, not every pixel)

**SwiftUI Example:**

```swift
VStack {
    HStack {
        Text("Volume")
        Spacer()
        Text("\(Int(volume * 100))%")
            .foregroundColor(.secondaryLabel)
    }
    Slider(value: $volume, in: 0...1)
        .accentColor(.blue)
}
```

---

### Stepper Component Contract

**Specs:**
- **Size:** 44pt height (touch target)
- **Buttons:** Minus (-) and Plus (+) buttons
- **Style:** Bordered or plain

**Usage:**
- Increment/decrement integer values
- Quantity selectors
- Adjustment controls

**Haptic Feedback:**
- On increment/decrement: `.impact(.light)`

**SwiftUI Example:**

```swift
Stepper("Quantity: \(quantity)", value: $quantity, in: 1...99)
    .onChange(of: quantity) { _ in
        HapticManager.impact(.light)
    }
```

---

## 3. Foundations: Navigation Patterns

### Tab Bar (3-5 Primary Destinations)

**When to use:** App has 3-5 top-level sections that users switch between frequently.

**Placement:** Bottom of screen (iOS convention, thumb-reachable).

**Specs:**
- **Height:** 49pt (compact size class), 50pt (regular size class)
- **Safe Area:** Extends below safe area bottom inset (background goes to bottom edge)
- **Icons:** SF Symbols, 25x25pt (30x30pt maximum)
- **Labels:** 10pt (`.caption2`), below icon
- **Active State:** Accent color (or custom color)
- **Badge:** Red dot or number on top-right of icon for notifications

**Antigravity Polish:**
- Scale animation on tap: icon scales 1.0 → 0.92 → 1.0 with `.antigravityQuick`
- Smooth color transition on selection (200ms ease-out)
- Haptic feedback on tab switch (`.selection`)
- Custom SF Symbols for brand consistency

**SwiftUI Example:**

```swift
TabView(selection: $selectedTab) {
    HomeView()
        .tabItem {
            Label("Home", systemImage: "house.fill")
        }
        .tag(Tab.home)

    SearchView()
        .tabItem {
            Label("Search", systemImage: "magnifyingglass")
        }
        .tag(Tab.search)

    ProfileView()
        .tabItem {
            Label("Profile", systemImage: "person.fill")
        }
        .tag(Tab.profile)
}
.onChange(of: selectedTab) { _ in
    HapticManager.selection()
}
```

**Do's and Don'ts:**

✅ **DO:** Use 3-5 tabs (optimal range)
✅ **DO:** Use SF Symbols for icons
✅ **DO:** Place tab bar at bottom

❌ **DON'T:** Use 6+ tabs (use hierarchical navigation instead)
❌ **DON'T:** Hide tab bar on scroll (users expect it always visible)
❌ **DON'T:** Put tab bar at top (that's Android, not iOS)

**Anti-pattern:** Don't use tab bar at top. iOS tab bars are ALWAYS at the bottom. Android uses bottom navigation OR top tabs, but iOS is bottom-only.

---

### Navigation Bar

**When to use:** Hierarchical navigation (drill-down pattern).

**Placement:** Top of screen.

**Styles:**

| Style | Title Size | When | Code |
|-------|-----------|------|------|
| **Large Title** | 34pt | List/collection views | `.navigationBarTitleDisplayMode(.large)` |
| **Inline Title** | 17pt semibold | Detail views, forms | `.navigationBarTitleDisplayMode(.inline)` |

**Elements:**

- **Back Button:** System-provided (< Back), left side - NEVER hide this
- **Title:** Center (inline) or large (top)
- **Trailing Actions:** 1-3 buttons, right side (more than 3 = use menu)

**Antigravity Polish:**
- Blur effect on scroll: `.background(.ultraThinMaterial)`
- Smooth title transition: large → inline on scroll
- Custom tint color for buttons
- Haptic feedback on toolbar button taps

**SwiftUI Example:**

```swift
NavigationStack {
    List(items) { item in
        NavigationLink(item.title, value: item)
    }
    .navigationTitle("Projects")
    .navigationBarTitleDisplayMode(.large)
    .toolbar {
        ToolbarItem(placement: .navigationBarTrailing) {
            Button {
                HapticManager.impact(.light)
                addItem()
            } label: {
                Image(systemName: "plus")
            }
        }
    }
}
```

**Do's and Don'ts:**

✅ **DO:** Use large titles for top-level lists
✅ **DO:** Let system provide back button
✅ **DO:** Limit trailing actions to 3 maximum

❌ **DON'T:** Hide the back button (users expect it)
❌ **DON'T:** Put 4+ buttons in navbar (use menu instead)
❌ **DON'T:** Break screen-edge swipe gesture (users swipe to go back)

---

### Modal Presentation

**Sheet (Card Modal):**

- **Sizes:** `.medium` (half screen), `.large` (full screen)
- **Dismiss:** Swipe down to dismiss (always enabled unless critical)
- **Drag Indicator:** Show if swipe-to-dismiss enabled
- **Use for:** Forms, detail views, secondary content

**Full Screen Cover:**

- **Dismiss:** No swipe-to-dismiss (requires button)
- **Use for:** Onboarding, critical flows, immersive experiences

**Action Sheet:**

- **Placement:** Bottom sheet
- **Use for:** Destructive actions, multiple choices
- **Structure:** Title, message, 2-6 action buttons

**Antigravity Polish:**
- Spring animation on present: `.antigravityDefault`
- Blur background when modal is active
- Smooth drag-to-dismiss gesture
- Haptic feedback on present/dismiss (`.impact(.medium)`)

**SwiftUI Example:**

```swift
// Sheet
.sheet(isPresented: $showingSheet) {
    EditView(item: item)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
}

// Full Screen Cover
.fullScreenCover(isPresented: $showingOnboarding) {
    OnboardingView()
}
```

---

## 4. Patterns: iOS-Specific Features

### Pull to Refresh

**Usage:** List or scroll view with live data that can be refreshed.

**Behavior:**
1. User pulls down from top of list
2. Refresh indicator appears
3. Release to trigger refresh
4. Indicator continues until data loads

**Implementation:** Use `.refreshable()` modifier in SwiftUI

**SwiftUI Example:**

```swift
List(items) { item in
    ItemRow(item: item)
}
.refreshable {
    await loadData()
}
```

---

### Swipe Gestures

**Swipe Actions on Lists:**

| Direction | Convention | Color | Example |
|-----------|------------|-------|---------|
| **Leading** (right swipe) | Positive actions | Green | Favorite, Mark Read, Complete |
| **Trailing** (left swipe) | Destructive actions | Red | Delete, Archive, Remove |

**Swipe to Go Back:**
- Screen edge swipe from left → goes back (system gesture)
- **Never disable** unless absolutely necessary (users expect this)

**Antigravity Polish:**
- Haptic feedback on swipe completion: `.impact(.medium)`
- Smooth animation on swipe
- Clear icon + text labels on swipe actions

**SwiftUI Example:**

```swift
List(items) { item in
    ItemRow(item: item)
        .swipeActions(edge: .leading) {
            Button {
                HapticManager.impact(.medium)
                favorite(item)
            } label: {
                Label("Favorite", systemImage: "star.fill")
            }
            .tint(.yellow)
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                HapticManager.impact(.medium)
                delete(item)
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
}
```

---

### Context Menus (Long Press)

**When:** Additional actions on an item without navigation.

**Behavior:**
- Long press on item (or right-click on Mac)
- Menu appears with actions
- Background blurs
- Haptic feedback on menu appear

**Structure:**
- 2-6 actions
- Destructive actions at bottom (red)
- Optional preview above menu

**SwiftUI Example:**

```swift
Image(item.image)
    .contextMenu {
        Button("Edit", systemImage: "pencil") {
            edit(item)
        }
        Button("Share", systemImage: "square.and.arrow.up") {
            share(item)
        }
        Divider()
        Button("Delete", systemImage: "trash", role: .destructive) {
            delete(item)
        }
    }
```

---

### Search

**Search Bar:**

- **Placement:** Navigation bar or below navbar
- **Cancel Button:** Appears when typing, returns to previous state
- **Keyboard:** `.search` type (has "Search" button)
- **Dismiss:** Tap Cancel or swipe down

**Scope Buttons:** Segmented control below search bar for filtering categories

**SwiftUI Example:**

```swift
NavigationStack {
    List(filteredItems) { item in
        ItemRow(item: item)
    }
    .searchable(text: $searchText, prompt: "Search projects")
}
```

---

### Segmented Control

**When:** 2-5 mutually exclusive options (like tabs, but inline)

**Appearance:**
- Rounded rect container
- Pill-shaped selected segment
- Smooth slide animation on selection

**Usage:** View switchers, filters, sorting options

**SwiftUI Example:**

```swift
Picker("View", selection: $viewMode) {
    Text("List").tag(ViewMode.list)
    Text("Grid").tag(ViewMode.grid)
    Text("Map").tag(ViewMode.map)
}
.pickerStyle(.segmented)
.padding()
```

---

### Live Activities (Modern iOS Feature)

**Usage:** Real-time updates on Lock Screen and Dynamic Island (iPhone 14 Pro+).

**Prime Antigravity Location:** Premium, high-visibility feature for showing app status.

**Examples:**
- Food delivery tracking
- Ride sharing status
- Sports scores
- Timer/workout progress

**Best Practices:**
- Keep content minimal (glanceable)
- Update frequently but not excessively
- Use vibrant colors (stands out on Lock Screen)
- Always provide meaningful status updates

---

### Dynamic Island (iPhone 14 Pro+)

**Usage:** Persistent, interactive space around front camera/sensors.

**States:**
- **Compact:** Small pill (music playing, timer)
- **Expanded:** Shows more detail on long press
- **Full:** Covers top of screen (incoming call)

**Antigravity Opportunity:** Premium location for app status, notifications, ongoing activities.

---

### Gestures (Centralized Guide)

**Standard iOS Gestures:**

| Gesture | Usage | Haptic | Example |
|---------|-------|--------|---------|
| **Tap** | Primary interaction | `.impact(.light)` | Button, list row |
| **Long Press** | Context menu, reorder | `.impact(.medium)` | Show options |
| **Drag** | Reorder, move | `.selection` (on snap) | List reordering |
| **Swipe** | Navigation, actions | `.impact(.medium)` | Delete, back |
| **Pinch** | Zoom, scale | None (visual feedback) | Image zoom |
| **Edge Swipe** | Back navigation | None (system gesture) | Go back |

**Implementation:** Use SwiftUI gesture modifiers (`.onTapGesture`, `.onLongPressGesture`, etc.)

---

## 5. Patterns: iPad-Specific Layouts

### Sidebar (NavigationSplitView)

**When:** iPad apps with hierarchical content (email, notes, file browser)

**Structure:**
- **Sidebar:** 320-375pt width, list of items
- **Detail:** Main content area, shows selected item
- **Optional Third Column:** For additional detail or tools

**SwiftUI Example:**

```swift
NavigationSplitView {
    // Sidebar
    List(folders, selection: $selectedFolder) { folder in
        Label(folder.name, systemImage: folder.icon)
    }
    .navigationTitle("Folders")
} detail: {
    // Detail view
    if let folder = selectedFolder {
        FolderDetailView(folder: folder)
    } else {
        Text("Select a folder")
            .foregroundColor(.secondaryLabel)
    }
}
```

---

### Popovers

**When:** Contextual menus, forms, or detail on iPad (replaces sheets on iPad)

**Behavior:**
- Appears as floating card
- Points to source element with arrow
- Dismissed by tapping outside
- Size: Fits content or explicit size

**SwiftUI Example:**

```swift
Button("Options") {
    showingPopover = true
}
.popover(isPresented: $showingPopover) {
    OptionsView()
        .frame(width: 300, height: 400)
}
```

---

### Multi-Column Layouts

**When:** iPad with lots of horizontal space (galleries, catalogs)

**Adaptive Grids:**
- Compact: 2 columns
- Regular: 3-4 columns
- Large: 4-5 columns

**SwiftUI Example:**

```swift
LazyVGrid(columns: [
    GridItem(.adaptive(minimum: 150, maximum: 200))
], spacing: 16) {
    ForEach(items) { item in
        ItemCard(item: item)
    }
}
```

---

## 6. Platform Guidelines: Layout & Spacing

### Safe Area (CRITICAL)

**Rule:** ALWAYS use system-provided safe area insets. NEVER hardcode padding.

**Why:** Safe area insets vary by:
- Device (iPhone 15 Pro vs iPhone SE vs iPad)
- Orientation (portrait vs landscape)
- Context (keyboard visible, toolbar present)
- Future iOS releases (new devices, new features)

**Correct Approach:**

✅ **SwiftUI:** Let framework manage safe area by default
```swift
VStack {
    // Content automatically respects safe area
}
```

✅ **Explicitly ignore safe area when needed:**
```swift
Image("background")
    .ignoresSafeArea() // Background image extends to edges
```

❌ **NEVER do this:**
```swift
VStack {
    // Content
}
.padding(.bottom, 34) // WRONG - hardcoded for home indicator
```

**Safe Area Regions:**
- **Top:** Notch, status bar (dynamic per device)
- **Bottom:** Home indicator (34pt on newer iPhones in portrait, but VARIES)
- **Sides:** 0pt in portrait, dynamic in landscape on notched devices

---

### Padding Standards

| Context | Padding | Token |
|---------|---------|-------|
| Screen edges | 16pt horizontal | `spacing-m` |
| Card padding | 16pt all sides | `spacing-m` |
| List row padding | 16pt horizontal | `spacing-m` |
| Between sections | 32pt vertical | `spacing-xl` |
| Between components | 16pt vertical | `spacing-m` |
| Tight spacing | 8pt | `spacing-s` |

---

### Size Classes

iOS uses size classes to adapt layouts:

**Horizontal Size Classes:**

| Class | Devices | Layout |
|-------|---------|--------|
| **Compact** | iPhone (portrait, all models) | Single column, tab bar nav |
| **Regular** | iPad (all), iPhone landscape (Plus/Max) | Two columns, sidebar nav |

**Vertical Size Classes:**

| Class | Devices |
|-------|---------|
| **Compact** | iPhone landscape |
| **Regular** | iPhone portrait, iPad |

**Adaptive Layouts:**

```swift
@Environment(\.horizontalSizeClass) var sizeClass

var body: some View {
    if sizeClass == .compact {
        // iPhone: Single column
        VStack {
            content
        }
    } else {
        // iPad: Two columns
        HStack {
            sidebar
            content
        }
    }
}
```

---

## 7. Platform Guidelines: Dark Mode

**Requirement:** Dark Mode is MANDATORY in iOS (not optional). Test EVERY screen in both light and dark mode.

### Using Semantic Colors

**Automatic Adaptation:**

```swift
// These adapt automatically to light/dark mode
Color(.systemBackground) // White (light), Black (dark)
Color(.label) // Black (light), White (dark)
Color(.secondaryLabel) // Gray (varies by mode)
```

### Custom Colors (Antigravity Palette)

**Asset Catalog:** Define colors with light + dark variants

```swift
// In Assets.xcassets:
// AccentCyan
//   - Any Appearance: #0891B2
//   - Dark Appearance: #06B6D4 (lighter, more vibrant)

// Usage:
Color("AccentCyan") // Automatically picks correct variant
```

### Dark Mode Best Practices

✅ **DO:**
- Use semantic system colors for text and backgrounds
- Test all screens in dark mode before shipping
- Make dark mode colors vibrant (not just desaturated versions)
- Use `.colorScheme(.dark)` preview for testing

❌ **DON'T:**
- Use `Color.black` or `Color.white` directly (breaks adaptation)
- Only test in light mode
- Forget to provide dark variants for custom colors
- Make dark mode feel "washed out" (Antigravity = vibrant!)

### Testing Dark Mode

```swift
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            ContentView()
                .preferredColorScheme(.light)

            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
```

---

## 8. Platform Guidelines: Accessibility

### Dynamic Type (CRITICAL for App Store Approval)

**Requirement:** All text MUST scale with user's text size preference.

**✅ CORRECT Implementation:**

```swift
Text("Welcome")
    .font(.headline) // Scales automatically

Text("Description")
    .font(.body) // Scales automatically
```

**❌ WRONG Implementation:**

```swift
Text("Welcome")
    .font(.system(size: 17)) // Does NOT scale - FAILS accessibility
```

**Semantic Style Mapping:**

- Page titles → `.font(.largeTitle)` or `.font(.title)`
- Section headers → `.font(.title2)` or `.font(.title3)`
- Body text → `.font(.body)`
- Labels/metadata → `.font(.subheadline)` or `.font(.caption)`
- Fine print → `.font(.footnote)` or `.font(.caption2)`

**Testing:** Test at largest accessibility text sizes (Settings → Accessibility → Display & Text Size → Larger Text → drag to maximum)

---

### VoiceOver (Screen Reader)

**Requirement:** All interactive elements must have descriptive labels.

**Accessibility Labels:**

```swift
// Icon-only button needs label
Button {
    addItem()
} label: {
    Image(systemName: "plus")
}
.accessibilityLabel("Add item")

// Custom view needs label
Rectangle()
    .fill(Color.blue)
    .accessibilityLabel("Project status indicator")
```

**Accessibility Hints (Optional):**

```swift
Button("Save") {
    save()
}
.accessibilityHint("Saves your changes to the server")
```

**Accessibility Grouping:**

For complex views (cards with multiple elements), group related content:

```swift
HStack {
    Image(systemName: "star.fill")
    Text("Featured")
    Text(item.title)
}
.accessibilityElement(children: .combine)
.accessibilityLabel("Featured: \(item.title)")
```

---

### Color Contrast (WCAG AA)

**Requirements:**
- **Text:** 4.5:1 contrast ratio minimum
- **UI Components:** 3:1 contrast ratio minimum
- **Test in BOTH light and dark mode**

**Tools:**
- Use Xcode Accessibility Inspector
- WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
- Figma contrast plugins

**Common Failures:**
- Gray text on light gray background
- Light blue text on white background
- Dark mode with insufficient contrast

---

### Touch Targets (Apple HIG Requirement)

**Minimum:** 44x44pt for ALL interactive elements

**Common Issues:**

❌ Icon button with 20pt icon but no padding (too small)
❌ List row with 32pt height (too short)
❌ Close button (X) with 16pt tap area (too small)

**Fixes:**

✅ Add padding to icon buttons to reach 44x44pt
✅ Use 44pt minimum row height in lists
✅ Make small interactive elements have larger hit areas

**SwiftUI:**

```swift
// Small icon, but 44pt tap area
Button {
    close()
} label: {
    Image(systemName: "xmark")
        .font(.system(size: 16))
}
.frame(width: 44, height: 44) // Ensures touch target
```

---

### Reduce Motion

**Requirement:** Respect user's Reduce Motion setting.

**Implementation:**

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

var body: some View {
    content
        .transition(reduceMotion ? .opacity : .scale)
}
```

**Best Practice:** Use crossfade (opacity) transitions instead of scale/slide when Reduce Motion is enabled.

---

### Advanced Accessibility

**Ignore Invert Colors:**

For images/logos that shouldn't be affected by Smart Invert:

```swift
Image("logo")
    .accessibilityIgnoresInvertColors()
```

**Custom Actions:**

For complex views with multiple actions:

```swift
itemView
    .accessibilityActions {
        Button("Favorite") { favorite(item) }
        Button("Share") { share(item) }
        Button("Delete") { delete(item) }
    }
```

---

## 9. Platform Guidelines: Animation & Feedback

### Animation Timing (Antigravity Standard)

**Named Animations (Use These):**

| Animation | Duration | Usage | Code |
|-----------|----------|-------|------|
| **antigravityQuick** | 150-200ms | Button presses, quick feedback | `.animation(.antigravityQuick)` |
| **antigravityDefault** | 300ms | View transitions, expansions | `.animation(.antigravityDefault)` |
| **antigravityGentle** | 400-500ms | Modal presentations, large movements | `.animation(.antigravityGentle)` |

**Spring Parameters:**

```swift
extension Animation {
    static let antigravityQuick = Animation.spring(response: 0.2, dampingFraction: 0.7)
    static let antigravityDefault = Animation.spring(response: 0.3, dampingFraction: 0.7)
    static let antigravityGentle = Animation.spring(response: 0.5, dampingFraction: 0.8)
}
```

**Usage:**

```swift
// Button press
Button("Tap Me") {
    isPressed = true
}
.scaleEffect(isPressed ? 0.97 : 1.0)
.animation(.antigravityQuick, value: isPressed)

// View transition
NavigationLink("Details", destination: DetailView())
    .transition(.asymmetric(insertion: .scale, removal: .opacity))
    .animation(.antigravityDefault)
```

---

### Haptic Feedback Hierarchy

**Antigravity Feedback Strategy:** Not everything needs haptics. Use hierarchy:

| Level | Haptic | When | Example |
|-------|--------|------|---------|
| **Subtle** | `.impact(.light)` | Primary interactions | Button taps, list row taps |
| **Medium** | `.impact(.medium)` | Significant actions | Swipe actions, drag completion |
| **Major** | `.notification(.success)` | Critical outcomes | Task complete, payment success |
| **Error** | `.notification(.error)` | Failures | Form validation error, API error |
| **Selection** | `.selection()` | Picker changes | Tab switch, picker scroll |

**Implementation:**

```swift
struct HapticManager {
    static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        UIImpactFeedbackGenerator(style: style).impactOccurred()
    }

    static func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        UINotificationFeedbackGenerator().notificationOccurred(type)
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}

// Usage
Button("Save") {
    HapticManager.impact(.light)
    save()
}
```

**Don't Overuse:** Static text, info icons, non-interactive elements should NOT have haptics.

---

### Antigravity Animation Conflicts: RESOLVED

**Conflict:** Custom transitions vs user expectation of standard iOS animations.

**Resolution:** Use **system transitions** for navigation structure. Apply **Antigravity polish** to content within screens.

**Correct Approach:**

✅ Navigation: Standard push/modal transitions (users expect this)
✅ Content: Animate elements within screens (fade-in list items, scale-up cards)

```swift
// System navigation transition (standard)
NavigationLink("Details", destination: DetailView())

// Antigravity polish on content (fade-in)
ForEach(items) { item in
    ItemRow(item: item)
        .transition(.opacity)
        .animation(.antigravityDefault, value: items)
}
```

❌ Custom screen transitions (breaks user expectation)

---

## 10. Platform Guidelines: States

### Empty State

**When:** No data available (first launch, deleted all items, no search results)

**Structure:**

- **Icon/Illustration:** 100-120pt, centered
- **Headline:** `.font(.title2)` (22pt), "No Items Yet"
- **Description:** `.font(.body)` (17pt), "Add your first item to get started"
- **Action Button:** Primary button, "Add Item"

**Vertical Spacing:** 16pt between elements (`spacing-m`)

**SwiftUI Example:**

```swift
VStack(spacing: 16) {
    Image(systemName: "tray")
        .font(.system(size: 100))
        .foregroundColor(.secondaryLabel)

    Text("No Projects Yet")
        .font(.title2)
        .fontWeight(.semibold)

    Text("Create your first project to get started")
        .font(.body)
        .foregroundColor(.secondaryLabel)
        .multilineTextAlignment(.center)

    Button("Create Project") {
        createProject()
    }
    .buttonStyle(.borderedProminent)
    .controlSize(.large)
}
.padding()
```

---

### Loading State

**Options:**

| Type | When | Implementation |
|------|------|---------------|
| **ProgressView (Spinner)** | Generic loading | `ProgressView()` |
| **Skeleton Screens** | List/grid loading | Gray placeholder shapes matching content |
| **Shimmering Placeholders** | Premium loading | Animated gradient sweep (Antigravity) |

**Best Practice:** Match loading state to expected content (skeleton rows for lists, spinner for generic)

**SwiftUI Example:**

```swift
if isLoading {
    ProgressView()
        .progressViewStyle(.circular)
} else {
    ContentView()
}
```

---

### Error State

**When:** Operation fails (network error, API error, validation failure)

**Structure:**

- **Error Icon:** SF Symbol `exclamationmark.triangle.fill` (red)
- **Error Message:** Specific and actionable
- **Retry Button:** "Try Again" or specific action

**Error Message Best Practices:**

✅ **Specific:** "Couldn't load data. Check your connection and try again."
❌ **Vague:** "Something went wrong"

✅ **Actionable:** "Email address not found. Check spelling or create an account."
❌ **Unhelpful:** "Invalid credentials"

**SwiftUI Example:**

```swift
VStack(spacing: 16) {
    Image(systemName: "exclamationmark.triangle.fill")
        .font(.system(size: 60))
        .foregroundColor(.red)

    Text("Couldn't Load Data")
        .font(.title2)
        .fontWeight(.semibold)

    Text("Check your connection and try again.")
        .font(.body)
        .foregroundColor(.secondaryLabel)
        .multilineTextAlignment(.center)

    Button("Try Again") {
        HapticManager.impact(.medium)
        retry()
    }
    .buttonStyle(.borderedProminent)
}
.padding()
```

---

## 11. Platform Integration

### SF Symbols (System Icons)

**Usage:** Use SF Symbols for ALL icons (over 5000 available).

**Benefits:**
- Consistent with iOS design language
- Automatically scale with Dynamic Type
- Support multiple weights (ultralight to black)
- Built-in multicolor variants
- Localized automatically

**⚠️ SF SYMBOLS LICENSING (CRITICAL):**

SF Symbols are licensed **ONLY for use on Apple platforms** (iOS, iPadOS, macOS, watchOS, tvOS).

**Allowed:** iOS app, iPad app, Mac app
**NOT Allowed:** Android app, web app, marketing materials (not on Apple device)

**Cross-Platform Impact:** When building cross-platform apps, you MUST use a different icon library for Android/web (Feather Icons, Material Symbols, Font Awesome).

**SwiftUI Usage:**

```swift
Image(systemName: "house.fill")
    .font(.title) // Scales with text

Image(systemName: "heart.fill")
    .font(.system(size: 24, weight: .semibold))
    .foregroundColor(.red)
```

**Custom SF Symbols:** Use SF Symbols app to create custom symbols that match SF style.

---

### Widgets (Home Screen)

**Sizes:**
- **Small:** 2x2 grid (single metric or status)
- **Medium:** 4x2 grid (overview or list)
- **Large:** 4x4 grid (detailed view or chart)

**Update Frequency:** System-controlled (not real-time)

**Best Practices:**
- Keep content glanceable (text sizes larger than in-app)
- Use vibrant colors (stands out on Home Screen)
- Deep link to specific app screen on tap

---

### Apple Watch Companion

**If Applicable:** Consider Apple Watch extension for Recap Rabbit.

**Key Principle:** Watch shows glanceable info and quick actions, NOT full app functionality.

**Examples:**
- Quick stats (today's summary)
- Complications (at-a-glance data on watch face)
- Quick actions (start/stop timer, log activity)

---

## 12. Review Checklist

Before submitting iOS design for review:

### Platform Conventions
- [ ] Tab bar at bottom (if used, not top)
- [ ] Navigation bar at top with system back button
- [ ] Back button on left (system-provided, not hidden)
- [ ] Safe area respected (no hardcoded padding)
- [ ] Touch targets 44x44pt minimum
- [ ] Screen edge swipe works for back navigation

### Dark Mode
- [ ] All screens tested in dark mode
- [ ] Custom colors have light + dark variants in asset catalog
- [ ] No `Color.black` or `Color.white` used directly
- [ ] Images have dark mode alternatives (if needed)

### Accessibility
- [ ] All text uses Dynamic Type (semantic styles, not hardcoded sizes)
- [ ] VoiceOver labels on all interactive elements (`.accessibilityLabel()`)
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Reduce Motion supported (alternative animations)
- [ ] Touch targets 44x44pt minimum verified

### Animations
- [ ] Spring animations for view transitions (`.antigravityDefault`)
- [ ] Haptic feedback on meaningful interactions (not everything)
- [ ] Respects Reduce Motion preference
- [ ] Animation timing appropriate (150ms quick, 300ms default, 400ms gentle)

### States
- [ ] Empty state designed (icon, message, CTA)
- [ ] Loading state (spinner or skeleton)
- [ ] Error state with specific message and retry action

### Antigravity Polish
- [ ] Vibrant custom colors (not just system defaults)
- [ ] Smooth micro-animations on interactions (scale on tap)
- [ ] Premium typography scale (semantic styles)
- [ ] Subtle shadows/materials on cards (`.ultraThinMaterial`)
- [ ] Custom SF Symbols for brand consistency (if applicable)
- [ ] Haptic feedback hierarchy followed (subtle/medium/major)

---

## 13. Common iOS Mistakes

1. **Android patterns on iOS** — FAB (floating action button) is Android. iOS uses tab bar or navbar buttons.
2. **Ignoring safe area** — Hardcoding padding (`padding(.bottom, 34)`) breaks on different devices.
3. **Hardcoded font sizes** — `.font(.system(size: 17))` breaks Dynamic Type. Use `.font(.body)`.
4. **Only testing light mode** — Dark mode is REQUIRED, not optional.
5. **Tiny touch targets** — < 44pt is unusable and fails accessibility. Even if icon is 20pt, hit area must be 44pt.
6. **No back button** — System provides back button automatically. Don't hide it.
7. **Breaking screen-edge swipe** — Custom navigation can break the swipe-back gesture users expect.
8. **Non-semantic colors** — `Color.black` or `Color.white` breaks dark mode. Use `Color(.label)`, `Color(.systemBackground)`.
9. **Over-animation** — Not every interaction needs animation. Follow haptic hierarchy (subtle/medium/major).
10. **Tab bar at top** — iOS tab bars are ALWAYS at bottom. Top tabs are Android.
11. **Hover states on iOS** — "Hover" is for web/desktop. iOS uses "highlighted" (finger down) state.
12. **SF Symbols on Android** — SF Symbols are ONLY for Apple platforms. Use alternative icons for cross-platform.

---

## 14. References

| Resource | What to Study | Link |
|----------|--------------|------|
| **Apple HIG** | Official iOS design guidelines | https://developer.apple.com/design/human-interface-guidelines/ios |
| **SF Symbols** | System icon library (5000+ icons) | https://developer.apple.com/sf-symbols/ |
| **WWDC Design Sessions** | Latest iOS design patterns | https://developer.apple.com/videos/design/ |
| **iOS Design Kit (Figma)** | Official Apple design resources | https://www.figma.com/community/file/1248375255495415511 |
| **Accessibility** | VoiceOver, Dynamic Type, Reduce Motion | https://developer.apple.com/accessibility/ |

---

## 15. Device Mockup Requirements

When creating design specs for iOS, provide mockups for:

**iPhone:**
- **iPhone 15 Pro** (393x852pt, 6.1") — Standard size, most common
- **iPhone 15 Pro Max** (430x932pt, 6.7") — Large size (if supporting)
- **iPhone SE** (375x667pt, 4.7") — Compact size (if supporting older devices)

**iPad:**
- **iPad Pro 12.9"** (1024x1366pt) — Large canvas
- **iPad Mini** (744x1133pt) — Compact tablet (if supporting)

**Orientations:**
- **Portrait** (primary, required)
- **Landscape** (if app supports rotation)

**Testing:** Use Xcode Simulator or real devices for accurate safe area and sizing.

---

**Cross-Platform Note:** For future React Native/Flutter support, see `design-mobile-crossplatform.md`. This file contains iOS-specific guidance only.

**Android Note:** For Material Design 3 and Android patterns, see `design-mobile-android.md` (coming in Priority 3).
