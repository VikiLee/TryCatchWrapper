import moment from 'moment'
export const sget = function (target, ...props){
  target = target || {}
  let obj = Object.assign(target)
  for (let prop of props) {
    if (obj[prop]) {
      obj = obj[prop]
    } else {
      return undefined
    }
  }
  return obj
}


export const $t = (key, data) => {
  const intl = require('react-intl-universal')
  return intl.get(key, data)
}

export const easyClone = (target) => {
  return JSON.parse(JSON.stringify(target))
}

export const isEmptyObj = (obj) => {
  return Object.keys(obj).length === 0
}

function isFunction(obj) {
  return toString.call(obj) === '[object Function]'
}

function eq(a, b, aStack, bStack) {
  // === 结果为 true 的区别出 +0 和 -0
  if (a === b) return a !== 0 || 1 / a === 1 / b;

  // typeof null 的结果为 object ，这里做判断，是为了让有 null 的情况尽早退出函数
  if (a == null || b == null) return false;

  // 判断 NaN
  if (a !== a) return b !== b;

  // 判断参数 a 类型，如果是基本类型，在这里可以直接返回 false
  var type = typeof a;
  if (type !== 'function' && type !== 'object' && typeof b !== 'object') return false;

  // 更复杂的对象使用 deepEq 函数进行深度比较
  return deepEq(a, b, aStack, bStack);
};

function deepEq(a, b, aStack, bStack) {
  // a 和 b 的内部属性 [[class]] 相同时 返回 true
  var className = toString.call(a);
  if (className !== toString.call(b)) return false;

  switch (className) {
    case '[object RegExp]':
    case '[object String]':
      return '' + a === '' + b;
    case '[object Number]':
      if (+a !== +a) return +b !== +b;
      return +a === 0 ? 1 / +a === 1 / b : +a === +b;
    case '[object Date]':
    case '[object Boolean]':
      return +a === +b;
  }

  var areArrays = className === '[object Array]';
  // 不是数组
  if (!areArrays) {
    // 过滤掉两个函数的情况
    if (typeof a != 'object' || typeof b != 'object') return false;

    var aCtor = a.constructor,
      bCtor = b.constructor;
    // aCtor 和 bCtor 必须都存在并且都不是 Object 构造函数的情况下，aCtor 不等于 bCtor， 那这两个对象就真的不相等啦
    if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
  }


  aStack = aStack || [];
  bStack = bStack || [];
  var length = aStack.length;

  // 检查是否有循环引用的部分
  while (length--) {
    if (aStack[length] === a) {
      return bStack[length] === b;
    }
  }

  aStack.push(a);
  bStack.push(b);

  // 数组判断
  if (areArrays) {

    length = a.length;
    if (length !== b.length) return false;

    while (length--) {
      if (!eq(a[length], b[length], aStack, bStack)) return false;
    }
  }
  // 对象判断
  else {
    var keys = Object.keys(a),
      key;
    length = keys.length;

    if (Object.keys(b).length !== length) return false;
    while (length--) {
      key = keys[length];
      if (!(b.hasOwnProperty(key) && eq(a[key], b[key], aStack, bStack))) return false;
    }
  }

  aStack.pop();
  bStack.pop();
  return true;
}

export const isEqual = (a, b) => {
  return eq(a, b)
}

export const isPlaginObject = function(obj) {
  // 排除不是对象类型/DOM对象/window对象
  if(typeof obj !== 'object' || obj.nodeType || obj.self === obj) {
    return false;
  }

  // 如果判断为对象，但对象的__proto__没有isPrototype方法，则说明不是通过new方式创建或者对象字面量，同时RegExp和Date对象也被区分开来
  if(obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
    return false
  }
  return true
}

export const fistLetterUpper = (str) => {
  if (typeof str === 'undefined') {
    return
  }
  return str.replace(str[0], str[0].toUpperCase())
}

export function getCookie (name) {
  return (document.cookie.match(new RegExp('(^' + name + '| ' + name + ')=([^;]*)')) == null) ? '' : decodeURIComponent(RegExp.$2)
}

export function setCookie (name, value, days) {
  let str = name + '=' + encodeURIComponent(value) + '; path=/;'
  if (days) {
    const exp = new Date()
    exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000)
    str += ' expires=' + exp.toGMTString()
  }
  document.cookie = str
}

export function removeCookie(name) {
  setCookie(name, '', -1)
}

export function isLogin() {
  return getCookie('token').length > 0 && getCookie('uid').length > 0
}

export const checkLogin = (cb) => {
  if (isLogin) {
    cb && cb()
  }
}

export const cleafLoginInfo = () => {
  removeCookie('uid')
  removeCookie('token')
}

export function goToLogin() {
  window.location.href = '/login'
}

export function goToHome() {
  window.location.href = '/'
}

export const getTimeZoneString = function () {
  const timeZone = moment().utcOffset() / 60
  let timeZoneString = ''
  timeZone >= 0 ? timeZoneString = '+' + timeZone : timeZoneString = '-' + timeZone
  timeZoneString += '00'
  if (timeZoneString.length === 4) {
    timeZoneString = timeZoneString[0] + '0' + timeZoneString.slice(1)
  }
  return 'GMT' + timeZoneString
}

//这里不对传进来的是不是数字做验证
export function reserveTwoNumberAfterDot (num) {
  let tmpNum = Number(num) * 100
  tmpNum = Number(parseInt(tmpNum + ''))
  return tmpNum / 100 + ''
}

//validator
export function validateZero2Hundred (num) {
  if (num.trim() === '') return false
  const tmpNum = +num
  if (isNaN(tmpNum) || tmpNum > 100 || tmpNum < 0) return false
  return true
}

//antd form validator
export function zero2HundredValidator (_, number, callback) {
  if (validateZero2Hundred(number)) {
    callback ()
  } else {
    callback('please input a number range from 0 to 100')
  }
}

export function readCSVFile(file, callback) {
  function csvToArray(csvString){
    let csvArray = csvString.split(/\r\n/).filter((value) => value !== '') //windows环境换行符
    if (csvArray.length === 1) { //其他环境换行符
      csvArray = csvString.split(/\n/).filter((value) => value !== '')
    }
    const datas = []
    const headers = csvArray[0].split(",")
    for(var i = 1; i < csvArray.length; i++){
        const data = {};
        const row = csvArray[i].split(",")
        for(let j = 0; j < headers.length; j++){
            data[headers[j]] = row[j]
        }
        datas.push(data)
    }
    return datas
  }
  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = function (data) {
    const dataArray = csvToArray(data.target.result)
    callback(dataArray)
  }
}
export function logout() {
  removeCookie('token')
  removeCookie('uid')
  goToLogin()
}

export function functionDeclaration() {
  // disable-try-catch in function declaration
  return 1
}

// specail
export let fun = () => {
  // disable-try-catch in arrow function expression
  return (1);
}

export const func = function() {
  console.log(111)
}

export const obj = {
  objectMethod: function() {
    // disable-try-catch in object method
  },
  objMethod1() {
    // disable-try-catch in object method1
  },
  objectMethod2: () => {
    // disable-try-catch in object method2
  }
}

export class Cls {
  constructor() {

  }

  classMethod() {

    // disable-try-catch in class method
  }
}
