function copy(o) {
    var copyObj = Object.create(Object.getPrototypeOf(o)),
        propNames = Object.getOwnPropertyNames(o);
        
    propNames.forEach(function(name) {
        var desc = Object.getOwnPropertyDescriptor(o,name);
        Object.defineProperty(copyObj,name,desc);
    });
    
    return copyObj;
}