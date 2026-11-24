# Unruly

An educational phone game from the IDEMS game studio, based on
*Unruly* (also known as Takuzu or Binairo) from
[Simon Tatham's Portable Puzzle Collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/).

Fill the grid with black and white squares. No three squares of the same
colour may be next to each other in a row or column, and every row and
column has as many black squares as white ones.

- Tap a square to make it black, tap again for white, and once more to
  empty it.
- Sizes 6×6 to 14×14, or a custom size up to 16×16 (even sizes only), at
  Easy, Medium and Hard (the original's Trivial, Easy and Normal).
- An interactive tutorial on first launch (and from the **?** button).
- Puzzles are generated on the device; the generator and solver are exact
  ports of the original, so a game ID such as `8x8dt#123456789012345` gives
  the same puzzle as the original collection.

Work in progress: the game itself is being ported.

Built with Angular and Capacitor, for Android and iOS.

## Getting started

The shared engine and shell come from the
[games-common-core](https://github.com/IDEMSInternational/games-common-core)
**submodule**, so clone with:

```sh
git clone --recurse-submodules https://github.com/IDEMSInternational/unruly.git
cd unruly
npm install
```

(If you already cloned without it: `git submodule update --init`.)
Run `npm install` here only, never inside `games-common-core`.

```sh
npm start              # dev server at http://localhost:4200
npm test               # unit tests, including 840 puzzles checked against the original
npm run build          # production web build
npm run apk            # Android debug APK -> Unruly.apk
npm run aab            # Android release bundle for Google Play -> Unruly.aab
```

`npm run apk` and `npm run aab` need JDK 21 (`JAVA_HOME`) and the Android SDK
(`ANDROID_HOME`, or `android/local.properties` with `sdk.dir=...`).

Google Play only accepts a bundle signed with the app's upload key, which is
never committed. `npm run aab` signs the bundle when these are set, and builds
it unsigned otherwise: `ANDROID_KEYSTORE` (path to the `.jks` file),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and, if it differs from the
keystore's, `ANDROID_KEY_PASSWORD`.

The iOS app needs a Mac with Xcode (or a macOS GitHub Actions runner). The
web build isn't committed in `ios/`, so build it and copy it in first, then
open or build `ios/App/App.xcodeproj` (scheme `App`; Swift Package Manager,
no CocoaPods):

```sh
npm ci
npm run build
npx cap sync ios
```

To use a newer version of the shared code:

```sh
git submodule update --remote games-common-core
npm test -- --watch=false
git commit -am "Update games-common-core"
```

## Releasing

The version lives in `package.json` only, as major.minor.patch (patch for
fixes, minor for new features, major for big changes). The menu shows it, and
the Android build reads it: `versionName` is the same text, and `versionCode`
(which must go up with every store upload) is major × 1,000,000 + minor ×
1,000 + patch, so 1.2.3 is 1002003. `npm version` also writes the same two numbers
into the iOS project (`MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`, via
`games-common-core/ios-release/ios-version.mjs`). Each game has its own version.

To release, bump the version (this commits and tags it, e.g. `v1.0.1`), push
with the tag, then build:

```sh
npm version patch      # or minor / major
git push --follow-tags
```

Then run **iOS - Release** from the repository's Actions tab, which builds the
app and uploads it to TestFlight, and **Android - Release**, which builds the
bundle, signs it and uploads it to Google Play (internal testing by default).
Each upload needs a new version.

While in beta the version stays below 1.0.0 (0.1.0, 0.2.0, ...); 1.0.0 is the
first full public release. For the first release, tag the current version
instead: `git tag v0.1.0`.

### iOS release setup

**iOS - Release** (`.github/workflows/ios-release.yml`) runs the iOS release
shared by every IDEMS game, from games-common-core:
[games-common-core/ios-release/README.md](https://github.com/IDEMSInternational/games-common-core/blob/main/ios-release/README.md)
explains how it works and how a game is set up for it. For Unruly, none of
that is done yet: the App ID `international.idems.games.unruly` must be
registered, with its app in App Store Connect, and the IDEMS organisation's
signing variables and secrets shared with this repository.

### Android release setup

**Android - Release** (`.github/workflows/android-release.yml`) runs the
Android release shared by every IDEMS game, from games-common-core:
[games-common-core/android-release/README.md](https://github.com/IDEMSInternational/games-common-core/blob/main/android-release/README.md)
explains how it works and how a game is set up for it: the upload key, the
Google Play service account, their secrets (`SIGNING_KEY`, `ALIAS`,
`KEY_STORE_PASSWORD`, `KEY_PASSWORD`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`), and
the first upload, which Google Play only takes by hand. For Unruly, none of
that is done yet.

The App ID is set in several files;
[A game's App ID](https://github.com/IDEMSInternational/games-common-core#a-games-app-id) lists them and
explains how to change it.

## Layout

```
src/games/unruly/           the game: no Angular except board/
  generator/                puzzle generation, one file per stage
  solver/                   deduction solver (Easy, Medium and Hard techniques)
  state, moves, input, ...  rules and touch handling
  tutorial.ts               the interactive tutorial's steps
  board/                    the Angular board component (SVG)
  testing/                  reference puzzles recorded from the original
src/app/                    wires the game into the shared shell
games-common-core/          shared engine and shell (submodule)
tools/c-reference/          builds the original C generator to record
                            reference puzzles (needs gcc and a checkout
                            of the original collection next to this one)
android/                    Capacitor's Android project
ios/                        Capacitor's iOS project (with Apple's privacy
                            manifest, App/App/PrivacyInfo.xcprivacy)
.github/workflows/          iOS - Release and Android - Release, which run
                            the releases shared by every game
                            (games-common-core/ios-release/, android-release/)
assets/app/                 icon and launch screen sources (tools/make-icon.mjs,
                            then npm run app-images for both platforms)
```

## Licence

MIT; see [LICENSE](LICENSE). Parts are ports of Simon Tatham's Portable
Puzzle Collection, whose notice is in [THIRD-PARTY-NOTICES](THIRD-PARTY-NOTICES).
