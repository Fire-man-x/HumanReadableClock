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
const pgettext = Domain.pgettext;
const npgettext = Domain.npgettext; // translations with context

let dateMenu = null;
let settings = null;
let fuzzyClock = null;
let updateClockId = 0;

function FuzzyClock() {
	this.init();
}

//settings set org.gnome.desktop.interface clock-show-seconds true
//this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.surf');
FuzzyClock.prototype = {
	init: function() {
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

	/**
	 * @param hour int
	 * @param minute int
	 * @returns {string}
	 */
	_formatHour: function(hour, minute) {
		let minutesFormat = {
			0: ngettext("X:00", "X:00", hour), //%is o'clock
			5: _("X:05"), //Five past %past
			10:_("X:10"), //Ten past %past
			15:_("X:15"), //Quarter past %past
			20:_("X:20"), //Twenty past %past
			25:_("X:25"), //Twenty five past %past
			30:_("X:30"), //Half past %past
			35:_("X:35"), //Twenty five to %to
			40:_("X:40"), //Twenty to %to
			45:_("X:45"), //Quarter to %to
			50:_("X:50"), //Ten to %to
			55:_("X:55"), //Five to %to
			60:ngettext("X:60", "X:60", hour) //%will o'clock
		};

		return minutesFormat[minute];
	},

	/**
	 * @param hour int
	 * @param context string
	 * @returns {string}
	 */
	formatHourName: function(hour, context) {
		//translations
		pgettext("Is", "Zero");
		pgettext("Past", "Zero");
		pgettext("To", "Zero");
		pgettext("Will be", "Zero");
		pgettext("Is", "One");
		pgettext("Past", "One");
		pgettext("To", "One");
		pgettext("Will be", "One");
		pgettext("Is", "Two");
		pgettext("Past", "Two");
		pgettext("To", "Two");
		pgettext("Will be", "Two");
		pgettext("Is", "Three");
		pgettext("Past", "Three");
		pgettext("To", "Three");
		pgettext("Will be", "Three");
		pgettext("Is", "Four");
		pgettext("Past", "Four");
		pgettext("To", "Four");
		pgettext("Will be", "Four");
		pgettext("Is", "Five");
		pgettext("Past", "Five");
		pgettext("To", "Five");
		pgettext("Will be", "Five");
		pgettext("Is", "Six");
		pgettext("Past", "Six");
		pgettext("To", "Six");
		pgettext("Will be", "Six");
		pgettext("Is", "Seven");
		pgettext("Past", "Seven");
		pgettext("To", "Seven");
		pgettext("Will be", "Seven");
		pgettext("Is", "Eight");
		pgettext("Past", "Eight");
		pgettext("To", "Eight");
		pgettext("Will be", "Eight");
		pgettext("Is", "Nine");
		pgettext("Past", "Nine");
		pgettext("To", "Nine");
		pgettext("Will be", "Nine");
		pgettext("Is", "Ten");
		pgettext("Past", "Ten");
		pgettext("To", "Ten");
		pgettext("Will be", "Ten");
		pgettext("Is", "Eleven");
		pgettext("Past", "Eleven");
		pgettext("To", "Eleven");
		pgettext("Will be", "Eleven");
		pgettext("Is", "Twelve");
		pgettext("Past", "Twelve");
		pgettext("To", "Twelve");
		pgettext("Will be", "Twelve");

		let hourNames = {
			0:pgettext(context, "Zero"), // translated to Twelve
			1:pgettext(context, "One"),
			2:pgettext(context, "Two"),
			3:pgettext(context, "Three"),
			4:pgettext(context, "Four"),
			5:pgettext(context, "Five"),
			6:pgettext(context, "Six"),
			7:pgettext(context, "Seven"),
			8:pgettext(context, "Eight"),
			9:pgettext(context, "Nine"),
			10:pgettext(context, "Ten"),
			11:pgettext(context, "Eleven"),
			12:pgettext(context, "Twelve")
		};

		return hourNames[hour];
	},

	/**
	 * @param now GLib.DateTime
	 * @returns {string}
	 */
	time: function(now) {
		let hours = now.get_hour();
		let minutes = Math.round(now.get_minute() / 5) * 5;
		return this._formatHour(hours, minutes)
			.replace("%is", this.formatHourName(hours >= 12 ? hours - 12 : hours, "Is"))
			.replace("%past", this.formatHourName(hours >= 12 ? hours - 12 : hours, "Past"))
			.replace("%to", this.formatHourName(hours + 1 >= 12 ? hours + 1 - 12 : hours + 1, "To"))
			.replace("%will", this.formatHourName(hours + 1 >= 12 ? hours + 1 - 12 : hours + 1, "Will be"))
			+ " " + now.get_minute();
	},

	/**
	 * @param now GLib.DateTime
	 * @returns {string}
	 */
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
