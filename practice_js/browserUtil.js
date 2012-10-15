function getIEVersionNumber() {
    var ua = navigator.userAgent;
    var MSIEOffset = ua.indexOf("MSIE ");
    if(MSIEOffset == -1) {
        return 0;
    } else {
        return parseFloat(ua.substring(MSIEOffset + 5, ua.indexOf(";", MSIEOffset)));
    }
}

function getNNVersionNumber() {
    if(navigator.appName == "Netscape") {
        var appVer = parseFloat(navigator.appVersion);
        if(appVer < 5) {
            return appVer;
        } else {
            if(typeof navigator.vendorSub != "undefined") {
                return parseFloat(navigator.vendorSub);
            }
        }
    }
    return 0;
}

function isLang(type) {
    var lang;
    if(typeof navigator.userLanguage != "undefined") {
        lang = navigator.userLanguage.toUpperCase();
    } else if(typeof navigator.language != "undefined") {
        lang = navigator.language.toUpperCase();
    }
    return (lang && lang.indexOf(type.toUpperCase()) === 0);
}

function linkTo(ieWinUrl,w3Url) {
    var isWin = (navigator.userAgent.indexOf("Win") != -1);
    var isIE5Min = getIEVersionNumber() >= 5;
    var isW3 = (document.getElementById) ? true:false;
    if (isWin && isIE5Min) {
        location.href =ieWinUrl;
        return false;
    } else if (isW3) {
        location.href = w3Url;
        return false;
    }
    return true;
}
