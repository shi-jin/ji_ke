//使用函数实现状态机处理字符
function match(string) {
    let state = start; //保存当前状态  start是状态函数
    for (let c of string) {
        state = state(c); //把状态切换到下一个状态
    }
    return state === end;
}

function start(c) {
    if (c === "a") {
        return foundA; //如果满足条件，切换到下一个状态
    } else {
        return start;
    }
}

function end(c) { //这是一个陷阱，一旦进入这个状态就不会进入别的状态
    return end;
}

function foundA(c) {
    if (c === "b") {
        return foundB; //如果满足条件，切换到下一个状态
    } else {
        return start(c); //start(c)重新使用改正bug 例如：如果第一次a匹配上了，后续又遇到a但是不完全匹配应该有bug
    }

}

function foundB(c) {
    if (c === "c") {
        return foundC; //如果满足条件，切换到下一个状态
    } else {
        return start(c);
    }

}

function foundC(c) {
    if (c === "d") {
        return foundD; //如果满足条件，切换到下一个状态
    } else {
        return start(c);
    }

}

function foundD(c) {
    if (c === "e") {
        return foundE; //如果满足条件，切换到下一个状态
    } else {
        return start(c);
    }

}

function foundE(c) {
    if (c === "f") {
        return end; //如果满足条件，返回结束状态
    } else {
        return start(c);
    }

}

console.log(match("I mababcdef groot")); //传入字符串