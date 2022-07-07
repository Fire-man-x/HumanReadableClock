const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Gettext = imports.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// This creates an object with functions for marking strings as translatable.
// You must pass the same domain as `ExtensionUtils.initTranslations()`.
const Domain = Gettext.domain('messages');

// These are the two most commonly used Gettext functions. The `gettext()`
// function is often aliased as `_()`
const _ = Domain.gettext;
const ngettext = Domain.ngettext;

let dateMenu = null;
let settings = null;
let fuzzyClock = null;
let updateClockId = 0;

function FuzzyClock() {
	this.init();
}

FuzzyClock.prototype = {
	init: function() {
		this.hour_format = [
			_("%0 o'clock"),
			_("Five past %0"),
			_("Ten past %0"),
			_("Quarter past %0"),
			_("Twenty past %0"),
			_("Twenty five past %0"),
			_("Half past %0"),
			_("Twenty five to %1"),
			_("Twenty to %1"),
			_("Quarter to %1"),
			_("Ten to %1"),
			_("Five to %1"),
			_("%1 o'clock")
		];
		this.hour_names = [
			_("Twelve"),
			_("One"),
			_("Two"),
			_("Three"),
			_("Four"),
			_("Five"),
			_("Six"),
			_("Seven"),
			_("Eight"),
			_("Nine"),
			_("Ten"),
			_("Eleven"),
			_("Twelve")
		];
		this.month_format = [
			_("Beginning of %0"),
			_("Early %0"),
			_("Middle of %0"),
			_("Late %0"),
			_("End of %0")
		];
		this.month_names = [
			_("January"),
			_("February"),
			_("March"),
			_("April"),
			_("May"),
			_("June"),
			_("July"),
			_("August"),
			_("September"),
			_("October"),
			_("November"),
			_("December")
		];
	},

	time: function(now) {
		let hours = now.get_hour();
		return this.hour_format[Math.round(now.get_minute() / 5)]
			.replace("%0", this.hour_names[hours >= 12 ? hours - 12 : hours])
			.replace("%1", this.hour_names[hours + 1 >= 12 ? hours + 1 - 12 : hours + 1]);
	},

	date: function(now) {
		let month = now.get_month();
		let day = now.get_day_of_month();
		let days = GLib.Date.get_days_in_month(month, now.get_year());
		return this.month_format[Math.round(4 * (day / days))]
			.replace("%0", this.month_names[month - 1]);
	}
};

function updateClockAndDate() {
	let tz = dateMenu._clock.get_timezone();
	let now = GLib.DateTime.new_now(tz);
	let clockStr = fuzzyClock.time(now);
	if (settings.get_boolean('clock-show-date')) {
		let dateStr = fuzzyClock.date(now);
		dateMenu._date.label = dateStr;
		clockStr += ", " + dateStr;
	}
	dateMenu._clockDisplay.text = clockStr;
}

function init() {
	//init translations
	ExtensionUtils.initTranslations('messages');
}

function enable() {
	dateMenu = Main.panel.statusArea['dateMenu'];
	if (!dateMenu) {
		return;
	}
	settings = new Gio.Settings({schema: 'org.gnome.desktop.interface'});
	fuzzyClock = new FuzzyClock();
	if (updateClockId !== 0) {
		dateMenu._clock.disconnect(updateClockId);
	}
	updateClockId = dateMenu._clock.connect('notify::clock', updateClockAndDate.bind(dateMenu));
	updateClockAndDate();
}

function disable() {
	if (!dateMenu) {
		return;
	}
	if (updateClockId !== 0) {
		dateMenu._clock.disconnect(updateClockId);
		updateClockId = 0;
	}
	dateMenu._clockDisplay.text = dateMenu._clock.clock;
	delete fuzzyClock;
	fuzzyClock = null;
	delete settings;
	settings = null;
	dateMenu = null;
}
