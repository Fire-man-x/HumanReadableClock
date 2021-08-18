# FuzzyClock

A human-readable clock for the gnome-shell panel that indicates the nearest five minute increments within the hour and splits months into five periods: beginning, early, middle, late and end.

![What time is it?](fuzzy_clock.png)

# Installation

cd ~/.local/share/gnome-shell/extensions

git clone git@github.com:theodoregoetz/FuzzyClock.git FuzzyClock@theodoregoetz

Enable or disable the fuzzy clock [via the browser](https://extensions.gnome.org/local/). You may need to change the `shell-version` field in `metadata.json`. The major version number you are running can be obtained by running `gnome-shell --version`.
