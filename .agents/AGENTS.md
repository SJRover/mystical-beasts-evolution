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

## Commits that do not change the app

Codemagic builds and uploads to TestFlight on every push to any branch. For commits that change
nothing in the app (tools/, notes, store images), put `[skip ci]` in the commit message so no
build is started. Codemagic runs on `mac_mini_m2` (M1 machines were retired) with `node: lts`
(`latest` gave a v27 alpha in November 2026). It uploads only (`submit_to_testflight: false`): the
external beta review step failed for want of Beta App Information, and internal testing and App Store
review do not need it. Info.plist declares `ITSAppUsesNonExemptEncryption` false (only Apple's HTTPS),
so TestFlight builds do not stop at Missing Compliance.

## In-App Purchases (from 1.3)

Real StoreKit purchases only, through cordova-plugin-purchase 13 (game.js `IAP_PRODUCTS`,
`initStoreKit`, `triggerIosPurchase`). The 1.1-1.2.2 simulated Apple Pay / Face ID sheet is gone:
it gave the items away free whenever the store was not ready. Consumables `boost_2x` (£1.99) and
`crates_premium_3x` (£2.99) exist in App Store Connect with exactly these IDs and are Approved
(Apple IDs 6782213692 and 6782215479). Delivery happens once per transaction id, then the transaction is finished.
