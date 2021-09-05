//1. 不使用状态机处理字符,在一个字符串中，找到"a"

function match(string) {
    for (let c of string) { //for 循环string里面的字符
        if (c == "a")
            return true;

    }
    return false;
}

match("I am groot"); //传入字符串

// 2.不使用状态机处理字符,在一个字符串中，找到"ab"

// 不使用正则表达式，因为正则表达式可以用有限状态机实现

function match(string) {
    let foundA = false;
    for (let c of string) { //for 循环string里面的字符
        if (c == "a")
            foundA = true; //说明已经找到a
        else if (foundA && c == "b") //如果a后面是b
            return true;
        else
            foundA = false;

    }
    return false;
}
console.log(match("I abm groot")); //传入字符串

// 3.不使用状态机处理字符,在一个字符串中，找到"abcdef"

// 不使用正则表达式，因为正则表达式可以用有限状态机实现

function match(string) {
    let foundA = false;
    let foundB = false;
    let foundC = false;
    let foundD = false;
    let foundE = false;

    for (let c of string) { //for 循环string里面的字符
        if (c == "a")
            foundA = true; //说明已经找到a
        else if (foundA && c == "b") //如果a后面是b
            foundB = true;
        else if (foundB && c == "c")
            foundC = true;
        else if (foundC && c == "d")
            foundD = true;
        else if (foundD && c == "e")
            foundE = true;
        else if (foundE && c == "f")
            return true;
        else {
            foundA = false;
            foundB = false;
            foundC = false;
            foundD = false;
            foundE = false;
        }


    }
    return false;
}
console.log(match("I mabcdef groot")); //传入字符串