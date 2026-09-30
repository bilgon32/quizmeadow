# Opening the community Mac release

Download the current release from https://github.com/bilgon32/quizmeadow/releases/latest.
Choose arm64 for Apple Silicon, or x64 for Intel. Unzip it and move
QuizMeadow.app into Applications before opening it.

The app is **ad-hoc signed**, so its code and bundled resources have a valid
integrity seal. It is **not signed with an Apple Developer ID or notarized by
Apple**. macOS can therefore block a downloaded copy on first open.

1. Try opening QuizMeadow once, then dismiss the warning.
2. Open **System Settings → Privacy & Security**.
3. Find the message about QuizMeadow and choose **Open Anyway**.
4. Confirm **Open** and authenticate if macOS asks.

Only approve a copy you downloaded from the project's release page. The
download includes SHA256SUMS.txt for checking the archive's integrity.
Apple explains the approval flow here:
https://support.apple.com/en-us/102445.

## If macOS still says “damaged”

Versions 1.0.0 and 1.0.1 shipped with an invalid resource seal. Replace them
with version 1.1.0 or later. Your quiz library and attempt history are stored
separately and are retained when you replace the app.

Some macOS versions also use the “damaged” message for an unnotarized app.
If **Open Anyway** is unavailable, you can explicitly trust this one app in
Terminal. First verify both the download and the installed signature:

```sh
# In the folder containing the downloaded ZIP and SHA256SUMS.txt:
shasum -a 256 -c SHA256SUMS.txt --ignore-missing
codesign --verify --deep --strict --verbose=2 /Applications/QuizMeadow.app
```

Continue only when the archive reports OK and codesign reports a valid app.
Then remove the downloaded-file quarantine flag from **this app only**:

```sh
xattr -dr com.apple.quarantine /Applications/QuizMeadow.app
open /Applications/QuizMeadow.app
```

This is a manual trust decision. It does not make the app Apple-notarized.
Do not disable Gatekeeper globally. A Mac managed by an organization may
require its administrator's approval instead.
