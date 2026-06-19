# Project Rules & Workspace Configuration - Merge Beasts

This configuration file outlines workspace settings, deployment pathways, and integration credentials for **Merge Beasts** (mystical-beasts-evolution).

## Workspace Architecture
* **Project Root**: `C:\Users\Samjo\.gemini\antigravity\scratch\mystical-beasts-evolution`
* **Web Distribution Directory**: `www/`
* **Capacitor Configuration**: `capacitor.config.json` targeting iOS native project `ios/App`
* **Playtest Directories**: Saved under custom subfolders (e.g. `1.1/`) before migration and sync to the root.

## CI/CD & Deployment Pipeline
* **CI/CD Platform**: **Codemagic** (already connected to Apple Developer Account)
* **App Store ID**: `com.samjo.mysticbeastsevolution`
* **Apple Developer App Name**: `Merge Beasts` / `mystical-beasts-evolution`
* **Provisioning & Code Signing**: Automated via Codemagic integrations (signing certificate and provisioning profiles stored securely in Codemagic environment variables).
* **Versioning**: Marketing version (`MARKETING_VERSION`) is set in `ios/App/App.xcodeproj/project.pbxproj`. Bundle build number (`CFBundleVersion`) is dynamically bumped to `$BUILD_NUMBER` by Codemagic's runner via `agvtool`.

## Deployment Workflow Rules (Must Remember Forever)
1. **Always Sync before Pushing**: Any changes made in playtest directories (e.g. `1.1/`) must be copied to the root, built (`npm run build` via dynamic asset copying in `build.js`), and synced (`npx cap sync`) to native source files.
2. **Never Run Local Xcode Archive**: The project is strictly set up to compile and upload through Codemagic. Simply push changes to origin/main and trigger the build inside the Codemagic Dashboard.
3. **Verify Marketing Version**: Before distributing a new release, verify `MARKETING_VERSION` in `project.pbxproj` is bumped to the correct value (e.g., `1.1` for the current update) to prevent duplicate build rejects in App Store Connect.

## Saved Notes & Apple Account Details
* **Apple Account App ID**: `mystical-beasts-evolution` (Connected directly to Codemagic).
* **Codemagic Integration Status**: Fully connected. Build runs are triggered via the Codemagic dashboard on the `main` branch. No credentials or provisioning files are required from the user because Codemagic manages certificates automatically.
* **Git Line Ending Warning Info**: The warning `LF will be replaced by CRLF` is a standard Git warning on Windows. It means Git is converting line endings from Unix style (LF) to Windows style (CRLF) for local files. This is completely safe, does not modify any code logic, and will not replace or delete any game files.

## How to Set Up Real In-App Purchases (IAP)
In version 1.1, the premium store purchases (£1.99 2x Boost and £2.99 3x Premium Crates) display a custom Apple Pay / Face ID mockup that simulates a Sandbox purchase. This is a local simulation. To make these purchases charge real money:

1. **Register Products in App Store Connect**:
   * Log into [App Store Connect](https://appstoreconnect.apple.com).
   * Go to **Apps > Merge Beasts > Features > In-App Purchases**.
   * Click `+` to add new In-App Purchases.
   * Select **Consumable** (since boosts/crates can be bought multiple times).
   * Use the exact product IDs:
     * `boost_2x` (Name: 1-Hour 2x Essence Boost, Price: £1.99)
     * `crates_premium_3x` (Name: 3x Premium Crates, Price: £2.99)
   * Fill out the display name, description, and upload a screenshot of the shop screen for review.

2. **Integrate the Capacitor Purchase Plugin**:
   * Install the plugin in the project:
     ```bash
     npm install cordova-plugin-purchase
     npx cap sync ios
     ```
   * Update `game.js` to register the product IDs and handle transaction states using StoreKit (see code blueprints in references).

3. **TestFlight Sandbox Environment Constraint**:
   * Even when native App Store IAPs are implemented, Apple forces all purchases on TestFlight to go through the **Sandbox environment**.
   * TestFlight testers will see native Apple payment prompts that say `[Sandbox]`, and **no real money will be charged**.
   * Real money is only charged in the production app downloaded from the public App Store after the app passes review.
