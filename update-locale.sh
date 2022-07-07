#!/usr/bin/env sh

#assumes source po files are in locale

mkdir -p ./locale
pot=./locale/gnome-shell-extension-locale.pot

touch $pot
xgettext --from-code=UTF-8 --output=$pot *.js
#xgettext -j ./locale/schemas/*.xml -o $pot # -j is as join

for locale_lang in locale/*; do
	if [ ! -d "$locale_lang" ]; then
			continue
	fi

	mkdir -p ./$locale_lang/LC_MESSAGES
	po=./$locale_lang/LC_MESSAGES/messages.po
	mo=./$locale_lang/LC_MESSAGES/messages.mo
	echo $po
	msgmerge --backup=off -U $po $pot
	msgfmt $po -o ${mo}
done

#rm $pot