var SPECIAL_DAYS = {
		2007: {
				3 : {
				
				},
				4 : {
				
				}
		}
};
var HOLIDAY_DAYS = {
		2007 : {
        3 : [ 2, 3, 4, 5, 6, 9, 10, 11, 12, 13 ] // Easter 
		}
};


// this function returns true if the passed date is special
function dateIsSpecial(year, month, day) {
		var m = SPECIAL_DAYS[year]? SPECIAL_DAYS[year][month]:false;
    if (!m) return false;
    for (var i in m) if (i == day) return 'special';
    return false;
}
// this function returns true if the passed date is a holiday
function dateIsHoliday(date, year, month, day) {
    // set all Saturdays and Sundays as holidays
    if (date.getDay() == 0 || date.getDay() == 6) return true;
		var m = HOLIDAY_DAYS[year]? HOLIDAY_DAYS[year][month]:false;
    if (!m) return false;
    for (var i in m) if (m[i] == day) return false;
    return false;
}
function dateStatusHandler(date, y, m, d) {
    var cls = dateIsSpecial(y, m, d);
		if (cls) {
		    return cls;
		} else if (dateIsHoliday(date, y, m, d)) {
		    return 'holiday';
		} else {
		    return false;
		}
}
function dateChangedHandler(calendar)
{
    if (calendar.dateClicked) {
        var year = calendar.date.getFullYear();
        var month = calendar.date.getMonth();
        var day = calendar.date.getDate();
				alert("/XMLdata.php?y=" + year + "&amp;m=" + month + "&amp;y=" + year);
				//alertMsg(calendar, year, month, day);
		}
}

