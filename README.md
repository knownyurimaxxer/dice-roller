**TLDR**: a dice roller. Real 3D dice, thrown on a board, with a physics engine
deciding where they land.

If you have an issue, just open an [Issue](../../issues)!

## What it does

- **Lots of dice.** d2, d3, d4, d6, d8, d10, d12, d14, d16, d18, d20 and d100.
  Tap a die to add one, tap the little number on it (or long-press the die)
  to take one away. Up to 10 of a kind and 20 dice at once (a d100 is two dice:
  tens and units).
- **Thrown for real.** The dice are 3D and the whole screen is the board:
  there is no tray, they bounce off the edges of the screen and clash with
  each other. The number that ends up on top is the result: nothing is decided
  in advance. A die leaning on a wall or on another die gets a nudge until it
  lands flat.
- **One tap, then the result.** Press Roll and the menu rolls down out of the
  way. When the dice stop, the result is announced in the middle of the
  screen, and you can change the dice, roll again, or save the roll.
- **Regular, advantage or disadvantage.** Regular adds the dice together.
  Advantage and disadvantage work with one kind of die: choosing them doubles
  your dice (a d20 becomes two d20), and only the highest (advantage) or the
  lowest (disadvantage) die of all of them counts. Add more dice and it still
  keeps just one.
- **Add everything up, or keep the kinds apart.** In regular mode, with more
  than one kind of die, choose between one total or one result per kind.
- **Favorites.** Tap the star next to Roll, or Save on the result, to save the
  dice, mode and option under a name (or no name, and it is called
  `2d20 + d6`). Open your favorites from the header and tap one to roll it
  straight away. You can rename or delete them.
- **History.** Every roll is kept, with what each die showed (the ones that
  didn't count are in parentheses). The last 200 are remembered.
- **Sound.** Rolling and clashing dice, and a little celebration when the
  result shows (a bigger one for a perfect roll). Both on by default and
  separately switchable in Settings.
- **Haptics.** Off by default. Turn them on in Settings, then choose which
  moments vibrate: throwing, clashing, the result and button taps.
- **Gestures.** Off by default. Turn it on in Settings and choose a
  sensitivity, then roll the dice by throwing the phone.
- **It never rotates by itself.** Settings > Orientation keeps the screen
  vertical or horizontal, so moving the phone to roll can't turn the screen.
  Vertical is the default.
- **Languages.** Settings > Language: "System default" follows the phone (and
  uses English when the phone's language isn't available), or pick one.
  English, Spanish, Catalan, Galician, Basque and Portuguese.
- **Make it yours.** Pick a theme. There are a few ready-made ones, or you can
  choose each color yourself. The dice use the accent color.
- **Big screens too.** It works in landscape and on tablets.

## What it doesn't do

- No accounts, no sync, no cloud. Your favorites and history live inside the app.
- Android only for now. There's no iPhone version available.
- If the 3D board can't start on a device, the app still rolls, with plain
  random numbers and no animation, and tells you so.

## Getting it on your phone

The easy way is [Obtainium](https://obtainium.imranr.dev/), which installs
apps straight from GitHub and tells you when there's an update.

1. Install Obtainium.
2. Open it, tap **Add App**, and paste the address of this very page.
3. Tap **Add**, then install. Android will ask you to allow installing apps
   from Obtainium. Say yes.

Prefer to do it by hand? Open the [Releases](../../releases) page, download
the latest `.apk` and open it on your phone.

Every time the code on the main branch changes, a new version shows up there
by itself.

## For tinkerers

It's an [Expo](https://expo.dev) app. `npm install`, then `npm start` to run
it, and `npm run check` to run the type check and the tests.

## Credits

[Ionicons](https://ionic.io/ionicons) by [@ionic](https://ionic.io/).

Made by [@knownyurimaxxer](https://www.tumblr.com/knownyurimaxxer).

If you ever feel like it, I have a [Ko-fi](https://ko-fi.com/knownyurimaxxer)!
