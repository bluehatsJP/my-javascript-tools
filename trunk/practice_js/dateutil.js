function daysBetween(date1, date2) {
    var DSTAdjust = 0;
    // 以下の計算で使用する定数
    var oneMinute = 1000 * 60;
    var oneDay = oneMinute * 60 *24;
    // 2つのdateオブジェクトの時刻を同じにする
    date1.setHours(0);
    date1.setMinutes(0);
    date1.setSeconds(0);
    date2.setHours(0);
    date2.setMinutes(0);
    date2.setSeconds(0);
    // 夏時間との切り替え時期をまたぐ場合への対応を行う
    if(date2 > date1) {
        DSTAdjust =
            (date2.getTimezoneOffset() - date1.getTimezoneOffset()) * oneMinute;
    } else {
        DSTAdjust =
            (date1.getTimezoneOffset() - date2.getTimezoneOffset()) * oneMinute;
    }
    var diff = Math.abs(date2.getTime() - date1.getTime()) - DSTAdjust;
    return Math.ceil(diff/oneDay);
}

function checkDate(strDate) {
    var mo, day, yr;
    var entry = strDate;
    var re = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b/;
    if(re.test(entry)) {
        var delimChar = (entry.indexOf("/") != -1) ? "/" : "-";
        var delim1 = entry.indexOf(delimChar);
        var delim2 = entry.lastIndexOf(delimChar);
        mo = parseInt(entry.substring(0, delim1), 10);
        day = parseInt(entry.substring(delim1 + 1, delim2), 10);
        yr = parseInt(entry.substring(delim2 + 1),10);
        var testDate = new Date(yr, mo - 1, day);
        alert(testDate);
        if(testDate.getDate() == day) {
            if(testDate.getMonth() + 1 == mo) {
                if(testDate.getFullYear() == yr) {
                    return true;
                } else {
                    alert("There is a problem with the year entry.");
                }
            } else {
                alert("There is a problem with the month entry.");
            }
        } else {
            alert("There is a problem with the date entry.");
        }
    } else {
        alert("Incorrect date format. Enter as mm/dd/yyyy.");
    }
    return false;
}