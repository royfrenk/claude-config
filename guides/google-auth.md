# Google Auth Guide

Google OAuth setup, token verification, and debugging across web and iOS (Capacitor).

> Every checklist item in this guide caused a real failure in production. Follow them exactly.

---

## Prerequisites

Before starting, collect these values from [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

| Value | Where to Find | Used By |
|-------|---------------|---------|
| Web Client ID | Credentials > OAuth 2.0 > Web application | Backend token verification, web login |
| Web Client Secret | Same as above | Backend (passport, server-side flow) |
| iOS Client ID | Credentials > OAuth 2.0 > iOS | iOS native sign-in |
| iOS Bundle ID | Xcode > Target > General > Bundle Identifier | Google Console iOS client config |

**Naming convention for env vars:**

```
GOOGLE_CLIENT_ID=<web-client-id>
GOOGLE_CLIENT_SECRET=<web-client-secret>
GOOGLE_IOS_CLIENT_ID=<ios-client-id>
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
```

---

## Part 1: Backend Token Verification

This applies to ALL platforms (web and iOS). The backend verifies Google ID tokens.

### Setup Checklist

- [ ] `GOOGLE_CLIENT_ID` env var set on backend (the client ID whose tokens you accept)
- [ ] Token verification library installed (`google-auth-library` for Node, `google-auth` for Python)
- [ ] Verification endpoint accepts `idToken` in request body
- [ ] Token `aud` (audience) claim validated against `GOOGLE_CLIENT_ID`
- [ ] Email extracted from verified token payload (not from unverified client data)
- [ ] User creation/lookup by email after verification

### Token Audience Rule (Critical)

The `aud` field in a Google ID token equals the client ID used to initiate sign-in. Your backend's `GOOGLE_CLIENT_ID` **must match** whatever `aud` value the token contains.

| Sign-In Client | Token `aud` Value | Backend `GOOGLE_CLIENT_ID` Must Be |
|----------------|-------------------|-------------------------------------|
| Web (passport) | Web Client ID | Web Client ID |
| iOS (default) | iOS Client ID | iOS Client ID |
| iOS (with `serverClientID`) | Web Client ID | Web Client ID |

**If you support both web and iOS**, you have two options:
1. Set iOS `serverClientID` to the Web Client ID (both platforms produce tokens with Web Client ID as `aud`)
2. Accept multiple audiences in your backend verification

**Option 1 is simpler.** Configure iOS to use `serverClientID` so all tokens have the same audience.

### Verification Pattern (Node.js)

```typescript
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload || !payload.email) {
    throw new Error('Google token missing email')
  }

  return {
    email: payload.email,
    name: payload.name,
    googleId: payload.sub,
  }
}
```

### Verification Pattern (Python / FastAPI)

```python
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_token(token: str) -> dict:
    client_id = os.environ["GOOGLE_CLIENT_ID"]
    payload = id_token.verify_oauth2_token(
        token,
        requests.Request(),
        client_id,
    )

    email = payload.get("email")
    if not email:
        raise ValueError("Google token missing email")

    return {
        "email": email,
        "name": payload.get("name"),
        "google_id": payload.get("sub"),
    }
```

### Debugging Token Issues

```
Error: "Token has wrong audience [X] expected [Y]"
  -> Compare token's aud (decode at jwt.io) with backend GOOGLE_CLIENT_ID
  -> They MUST match. Either change the backend env var or adjust the client config.

Error: "Token used too late" / expired token
  -> Tokens expire after ~1 hour. Verify immediately after sign-in, don't cache.

Error: 401 on POST /api/auth/google
  -> Check backend logs for the actual verification error
  -> Common: audience mismatch, expired token, wrong GOOGLE_CLIENT_ID
```

---

## Part 2: Web Login (Passport.js)

Server-side OAuth flow using `passport-google-oauth20`.

### Setup Checklist

- [ ] `passport` and `passport-google-oauth20` installed
- [ ] `GOOGLE_CLIENT_ID` set (Web Client ID)
- [ ] `GOOGLE_CLIENT_SECRET` set (Web Client Secret)
- [ ] `GOOGLE_CALLBACK_URL` set and matches Google Console "Authorized redirect URIs" exactly
- [ ] Callback URL registered in Google Console (including protocol, port, path)
- [ ] Session middleware configured before passport middleware
- [ ] `passport.serializeUser()` and `passport.deserializeUser()` defined
- [ ] OAuth profile validated at boundary (email may be missing)

### Profile Validation (Critical)

Google does not guarantee all profile fields exist. Validate at the boundary:

```typescript
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  // Validate profile at boundary - email is NOT guaranteed
  if (!profile.emails || profile.emails.length === 0) {
    return done(new Error('Google profile missing email'))
  }

  const email = profile.emails[0].value
  if (!email || typeof email !== 'string') {
    return done(new Error('Google email is invalid'))
  }

  // Now safe to use email for user lookup/creation
  findOrCreateUser(email, profile.displayName)
    .then(user => done(null, user))
    .catch(error => done(error))
}))
```

### Common Web Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Callback URL mismatch | "redirect_uri_mismatch" error | URL in code must match Google Console exactly (protocol, port, path) |
| Missing session middleware | `req.user` is always undefined | Add `express-session` before `passport.initialize()` |
| Confusing `passport` with `passport-google-oauth20` | Config structure errors | They have different config shapes -- check the right docs |
| Missing `profile` scope | No email in profile | Request `['profile', 'email']` scopes |

### Callback URL Checklist

The callback URL must match in THREE places:

1. **Google Console** > Credentials > OAuth client > Authorized redirect URIs
2. **Backend code** > `callbackURL` in GoogleStrategy config
3. **Environment variable** > `GOOGLE_CALLBACK_URL`

```
# All three must be identical:
https://your-domain.com/api/auth/google/callback
```

**Per-environment URLs:**
- Local: `http://localhost:8000/api/auth/google/callback`
- Staging: `https://your-staging.up.railway.app/api/auth/google/callback`
- Production: `https://your-domain.com/api/auth/google/callback`

Each environment's URL must be registered in Google Console.

---

## Part 3: iOS Login (Capacitor)

Native Google Sign-In using GoogleSignIn SDK via a custom Capacitor plugin bridge.

### Google Console Setup

- [ ] iOS OAuth client exists in Google Console
- [ ] Bundle ID in Google Console matches Xcode Bundle Identifier exactly
- [ ] Note the iOS Client ID and its reverse client ID (e.g., `com.googleusercontent.apps.YOUR-IOS-CLIENT-ID`)

### Native iOS Setup (Swift Package Manager)

- [ ] GoogleSignIn SDK added via SPM (not CocoaPods):
  - Xcode > File > Add Package Dependencies > `https://github.com/google/GoogleSignIn-iOS`
  - Select `GoogleSignIn` and `GoogleSignInSwift` products
- [ ] `Info.plist` has `GIDClientID` set to the iOS Client ID
- [ ] `Info.plist` has `CFBundleURLTypes` with the reverse client ID as a URL scheme
- [ ] `AppDelegate.swift` imports `GoogleSignIn` and handles URL callback:

```swift
import GoogleSignIn

func application(_ app: UIApplication, open url: URL,
                 options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    if GIDSignIn.sharedInstance.handle(url) { return true }
    return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
}
```

### Capacitor Plugin Bridge

- [ ] Custom `GoogleAuthPlugin.swift` created with `CAPPlugin, CAPBridgedPlugin`
- [ ] Plugin has `initialize()` and `signIn()` methods
- [ ] `initialize()` reads `GIDClientID` from `Info.plist` and creates `GIDConfiguration`
- [ ] `signIn()` dispatches to main thread (`DispatchQueue.main.async`)
- [ ] **Both Swift files are listed in Xcode's `project.pbxproj`** in ALL four sections:
  - `PBXBuildFile` (compile instructions)
  - `PBXFileReference` (file definitions)
  - `PBXGroup` (App group listing)
  - `PBXSourcesBuildPhase` (build sources)

> Files existing on disk is NOT enough. Xcode will not compile them unless they appear in `project.pbxproj`. This causes "plugin not found" errors with no obvious explanation.

### Capacitor Local Plugin Registration (Critical)

Capacitor does NOT auto-discover local Swift plugins. Only NPM-installed plugins get auto-registration. You must register manually:

- [ ] Custom view controller created (e.g., `MyViewController.swift`), subclassing `CAPBridgeViewController`
- [ ] `capacitorDidLoad()` calls `bridge?.registerPluginInstance(GoogleAuthPlugin())`
- [ ] `Main.storyboard` view controller class changed from `CAPBridgeViewController` to your custom class with module `App`

```swift
import Capacitor

class MyViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(GoogleAuthPlugin())
    }
}
```

> This is the number one Capacitor Google Auth gotcha. If the plugin is "not found" at runtime, this is almost certainly the cause.

### JS/TS Side

- [ ] Use `registerPlugin()` from `@capacitor/core` (NOT a community plugin import)
- [ ] Call `initialize()` before `signIn()`
- [ ] Handle cancellation: check for "cancel" in error message or error code `12501`

```typescript
import { registerPlugin } from '@capacitor/core'

interface GoogleAuthPlugin {
  initialize(): Promise<void>
  signIn(): Promise<{ idToken: string }>
}

const GoogleAuth = registerPlugin<GoogleAuthPlugin>('GoogleAuth')

async function signInWithGoogle(): Promise<string> {
  await GoogleAuth.initialize()
  const result = await GoogleAuth.signIn()
  return result.idToken
}
```

### CORS and Networking

- [ ] `CapacitorHttp` enabled in `capacitor.config.ts`:

```typescript
plugins: {
  CapacitorHttp: { enabled: true },
}
```

This routes ALL `fetch()` calls through native iOS networking, bypassing WKWebView CORS restrictions. Without it, iOS WKWebView sends requests from `capacitor://localhost` origin, which most backends reject. The error appears as "Load failed" with no useful details.

### Simulator vs Device

- [ ] `.env` / `VITE_API_URL` (or equivalent) set correctly per target:
  - **Simulator:** `http://localhost:8000` (shares Mac's network)
  - **Physical device:** `https://your-staging-url.up.railway.app` (NOT localhost)

> `localhost` on a physical device refers to the phone itself, not your Mac. This causes "could not connect to the server" errors.

---

## Part 4: Token Audience Configuration (iOS + Backend)

This is the most common source of "it works on web but not iOS" failures.

### Quick Reference

| GIDConfiguration | Token `aud` | Backend `GOOGLE_CLIENT_ID` |
|------------------|-------------|----------------------------|
| `clientID: <ios-client-id>` | iOS Client ID | Must be iOS Client ID |
| `clientID: <ios-client-id>, serverClientID: <web-client-id>` | Web Client ID | Must be Web Client ID |

### Decision Flowchart

```
Q: Does your backend already verify tokens with the Web Client ID?
  |
  YES -> Set serverClientID in GIDConfiguration to the Web Client ID
  |      Token aud will be Web Client ID. Backend works unchanged.
  |
  NO  -> Two options:
         A) Set backend GOOGLE_CLIENT_ID to iOS Client ID
            (Simple, but web login needs separate handling)
         B) Set serverClientID to Web Client ID
            (Both platforms use same audience -- recommended)
```

**Recommended approach:** Always set `serverClientID` to the Web Client ID so both web and iOS tokens have the same `aud`. This lets you use a single `GOOGLE_CLIENT_ID` on the backend.

### How to Verify

1. Sign in on iOS
2. Decode the returned `idToken` at [jwt.io](https://jwt.io)
3. Check the `aud` field
4. Compare with backend's `GOOGLE_CLIENT_ID` env var
5. They must match exactly

---

## Debugging Flowchart

```
Error: "Load failed"
  -> CORS issue. Enable CapacitorHttp in capacitor.config.ts.

Error: "could not connect to the server"
  -> Check API URL in .env -- is it localhost?
  -> Physical device needs a real URL, not localhost.
  -> Verify backend health: curl https://your-backend/health

Error: "Token has wrong audience [X] expected [Y]"
  -> Audience mismatch. Compare:
     1. Token's aud (decode at jwt.io)
     2. Backend's GOOGLE_CLIENT_ID env var
  -> They MUST match. Either change the backend env var or adjust serverClientID.

Error: "sign up failed" / 401 on POST /api/auth/google
  -> Token verification failed on backend.
  -> Check backend logs for the actual error message.
  -> Common: audience mismatch, expired token, wrong GOOGLE_CLIENT_ID.

Error: "No view controller available"
  -> Plugin not registered. Check MyViewController + Main.storyboard setup.

Error: Plugin method not found / "GoogleAuth" not registered
  -> Files not in project.pbxproj, or Main.storyboard still uses CAPBridgeViewController.

Error: "redirect_uri_mismatch" (web)
  -> Callback URL doesn't match Google Console.
  -> Check all three places: Console, code, env var.

Error: req.user is undefined (web)
  -> Session middleware missing or ordered after passport middleware.

App blank screen / won't load after adding plugin
  -> Swift files not in project.pbxproj. Check all 4 sections.
```

---

## Environment Checklist

Before deploying to any environment, verify:

### Backend
- [ ] `GOOGLE_CLIENT_ID` set and matches the token audience you expect
- [ ] `GOOGLE_CLIENT_SECRET` set (web flow only)
- [ ] `GOOGLE_CALLBACK_URL` set and registered in Google Console (web flow only)
- [ ] Token verification endpoint tested with a real token

### Web Frontend
- [ ] OAuth redirect triggers correctly
- [ ] Callback URL matches backend and Google Console

### iOS
- [ ] `GIDClientID` in Info.plist is the iOS Client ID
- [ ] URL scheme is the reverse client ID
- [ ] `serverClientID` set if backend uses Web Client ID
- [ ] `CapacitorHttp` enabled
- [ ] API URL is not localhost (for physical device testing)
- [ ] Plugin registered in custom view controller
- [ ] Swift files in project.pbxproj (all 4 sections)

---

## See Also

- Security rules: `~/.claude/rules/security.md` (OAuth profile validation patterns)
- Stability rules: `~/.claude/rules/stability.md` (API misuse prevention, passport gotchas)
- API integration: `~/.claude/guides/api-integration-patterns.md` (env var handling, fallbacks)
