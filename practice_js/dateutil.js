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