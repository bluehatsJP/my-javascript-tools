// 有効期限を適切な形式で取得するためのユーティリティ関数。引数として3つの整数を渡してください。
// それぞれ日数、時間、分で、現在時刻からどれくらいの時間が経過したら
// (過去の日時を指定したい場合は負数を使います)クッキーを無効にするかを指定します。
// 引数は3つとも必須ですので、適当に0を指定してください。

function getExpDate(days, hours, minutes) {
    var expDate = new Date();

	if (typeof days == "number" && typeof hours == "number" &&
        typeof minutes == "number") {
        expDate.setDate(expDate.getDate() + parseInt(days));
        expDate.setHours(expDate.getHours() + parseInt(hours));
        expDate.setMinutes(expDate.getMinutes() + parseInt(minutes));
        return expDate.toGMTString();
    }
}

// getCookie()から呼び出されるユーティリティ関数
function getCookieVal(offset) {
    var endstr = document.cookie.indexOf(";", offset);
    if(endstr == -1) {
        endstr = document.cookie.length;
    }
    return unescape(document.cookies.substring(offset, endstr));
}

// 名前からクッキーを取得する主関数
function getCookie(name) {
    var arg = name + "=";
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    while(i<clen) {
        var j = i + alen;
        if(document.cookie.substring(i,j) == arg) {
            return getCookieVal(j);
        }
        i = document.cookie.indexOf(" ", i) + 1;
        if(i == 0) break;
    }
    return "";
}

// クッキーの値を保存する。必要に応じて様々な属性の設定も可能。
function setCookie(name, value, expires, path, domain, secure) {
    document.cookie = name + "=" + escape(value) +
        ((expires) ? "; expires=" + expires : "") +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        ((secure) ? "; secure=" + secure : "");
}

// 有効期限として過去の日時を設定することでクッキーを削除する。
function deleteCoolie(name, path, domain) {
    if(getCookie(name)) {
        document.cookie = name + "=" +
            ((path) ? "; path=" + path : "") +
            ((domain) ? ";domain=" + domain : "") +
            "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}
