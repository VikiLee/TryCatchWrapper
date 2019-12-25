## 背景
js是单线程的弱类型的脚本语言，所以很多错误会在运行的时候才会发现，一旦出现运行时的错误，那么整个js线程都会挂掉，导致我们页面没有响应，所以我们需要有一种手段来避免，而将代码用try catch包括就是最容易实现的一种方式，但是前端工程师们很少会用try catch把代码包括起来，那么就需要一种手段来自动化去做这件事情。

既然我们要做的事情就是把函数体全部用try catch包裹起来，那么就需要遍历整个代码的所有函数，因此AST是一个最适合的选择。借助AST语法树，我们可以遍历所有函数，并修改函数里面的内容。 

### AST语法树
抽象语法树是一种统一的结构，能够把各种语言转化成一种统一的树形结构，即是说所有的语言都会转化成一种统一的结构，以便计算机识别。

我们看看浏览器执行js的过程：js引擎将js解析成AST->编译成字节码->执行

![](https://user-gold-cdn.xitu.io/2019/12/24/16f36a0a42535292?w=800&h=334&f=jpeg&s=67259)

抽象语法树例子：

```
while (b != 0) {
    if (a > b) {
        a = a - b
    } else {
        a = b -a
    }
    return a
}   
```
![](https://user-gold-cdn.xitu.io/2019/12/24/16f36159641ef4d6?w=800&h=903&f=png&s=52971)

计算机语言，一般都是由Statement、expression和declaration组成。所以，在了解AST前，我们需要了解这三个是什么。

#### Statement
语句是用来控制程序流程或者用来管理零个或多个语句。
- BlockStatement：大括号包裹起来的语句块
- IfStatement： if语句
- SwitchStatement: switch语句
- WhileStatement: while语句
- ForStatement: for语句
- TryStatement: try语句

#### Expression
表达式是用来计算或者返回 一个结果的，比如所有的运算操作都是表达式，除此之外，函数的调用也是一种表达式，es6的箭头函数也是一种表达式。  
js中有函数/数组/类表达式的概念，即把一个函数/数组/类赋值给一个变量（其他语言不知道...）。


expression | description
---|---
BinaryExpression | 二元运算表达式，eg: +-*/
ConditionExpression | 三元运算表达式，eg: ()? :
LogicalExpression | 逻辑运算表达式
CallExpression | 函数调用表达式
ArrowFunctionExpression | 箭头函数表达式
FunctionExression | 函数表达式
ArrayExpression | 数组表达式
ClassExpression | 类表达式

#### Declaration
js中，变量的申明不外乎三种方式var、const和let，还有二个很特殊的，函数申明和类申明。除此之外，es6还有import申明。

当然，这里面所列的不是全的，只是一些大家听过比较多，运用应该也是比较多的。如果要了解更多，可以通过babel-types的官网去了解。[点击进入](https://babeljs.io/docs/en/next/babel-types.html)

### 抽象语法树的运用
简单来说只要用到语法分析或者修改修改源码的，都可以利用抽象语法树来完成，比如typescript语法校验、IDE的语法校验高亮、eslint、ulglify-js、以及babel的tramsform、@babel/preset-react等等。可想而知，抽象语法树运用还是很广的。

## 实现思路
通过babel库来实现。babel-core提供了访问修改AST的功能，所以我们可以直接利用babel库来实现，同时我们需要用到babel-types和@babel/template的babel工具包。  
- babel-core，babel核心包，可以访问AST树并对代码进行转换。  
- babel-types，babel工具包，可以用来判断一个树节点是什么类型以及创建statement、declaration以及expression这些树节点。  
- @babel/template，方便将字符串转为AST节点。

我们的思路是，找到所有函数可能出现的AST节点，找到这些节点后，我们可以在遍历这些节点的时候，找出函数里面的内容，然后通过babel-types提供的方法去生成TryStatement，把函数里面的内容包裹起来，然后覆盖掉原来的函数里面的内容。

### 定义访问器
在上面对AST的介绍中，我们可以找到函数定义有三种方式，即FunctionExpression、ArrowFuntionExpression和FunctionDeclaration，因此我们就可以定义我们的访问器了。

```
var babel = require('babel-core');
var babelPlugin = { visitor };
let visitor = {
  ArrowFunctionExpression(path) {
    // do stuff here
  },
  FunctionExpression(path) {
    // do stuff here
  },
  FunctionDeclaration(path) {
    // do stuff here
  }
}
var result = babel.transform(code, {
  plugins: [
    babelPlugin
  ]
})
console.log(result.code)
```
### 获取函数里面的内容并生成TryStatement
函数里面的内容，正常情况下，它只可能是一个BlockStatement，但是箭头函数出现后，它就变得复杂了，它除了会是一个BlockStatment外，也有可能是一个表达式，亦或者一个值。  
我们看下普通的函数申明的AST树:
```
function test() {
    console.log(111)
}
```
它对应的AST树是这样的
![](https://user-gold-cdn.xitu.io/2019/12/24/16f370e3def362e9?w=757&h=443&f=png&s=52726)

可以看到，如果是blockStatment的话，函数里面的内容是body.body数组。

箭头函数的函数内容直接为一个值的情况:

```
var test = () => 0
```
对应的AST如下：
![](https://user-gold-cdn.xitu.io/2019/12/24/16f370d536b8158c?w=980&h=842&f=png&s=135821)  

总之，我们获取函数里面的内容，就是取函数节点的body属性，然后利用babel-types生成TryStatement。生成TryStatement请参考[这里](https://note.youdao.com/)。
```
let visitor = {
  'ArrowFunctionExpression|FunctionExpression|FunctionDeclaration': function(path) {
      let body = path.node.body
      // ...此处省略catch的生成
      let tryStatement = types.tryStatement(body, catchClause);
  }
}
```
注意我们上面指出了try statement的生成，但是我们还未定义catch里面的内容，下面会讲到。

### 生成catch体
catch是一个类型函数的东西，但它又不是，它接受一个参数，这个参数就是Error对象，catch里面的内容我们一般会对异常进行一些处理，比如然后上报到后端，但是很多时候我们的代码是经过混淆压缩的，所以error里面我们不能获取到具体发生错误的具体行列以及导致error的函数的函数名。  

那么我们要如何定位到异常发生的地方呢？我们在访问函数节点的时候，AST节点实际上是保留了这些信息的。所以我们可以在访问器中事先获取这些信息，并把它塞到原来的catch体里面。**这里的行列只能是函数开始的行列，不能定位到error发生的行列。**

获取行列信息很简单，通过获取节点的loc属性便可。但是获取函数名，就比较复杂了，函数的定义，有三种方式，如果不是以函数申明的方式定义函数，那么函数名的获取，需要从它父节点中获取，并且还要判断父节点的类型，如果是普通的函数表达式，从父节点的id属性获取，如果是对象属性方法，那么需要从父节点的key属性获取。实际上还有类的情况没考虑，这里先不考虑，后续有时间再补充。还有一种情况就是函数可能是匿名的。综合考虑后，获取函数名的代码如下：
```
let visitor = {
  'ArrowFunctionExpression|FunctionExpression|FunctionDeclaration': function(path) {
      let node = path.node
      let body = node.body
      
      // 获取行列
      let line = node.loc.start.line
      let column = node.loc.start.column
      
      // 获取函数名
      let funcName = 'anonymous function';
      // 如果是函数申明，则可以直接从id属性获取
      if (node.id) {
        funcName = node.id.name
      } 
      // 有父节点，并且父节点是申明，则说明是函数申明的方式创建的函数，需要从父节点获取函数名 
      if (types.isVariableDeclarator(path.parentPath)) {
        funcName = path.parentPath.node.id.name;
      } else if (types.isProperty(path.parentPath)) {
        // 通过对象属性定义的函数
        funcName = path.parentPath.node.key.name;
      } 
     
      // ...此处省略catch的生成
      let tryStatement = types.tryStatement(body, catchClause);
  }
}
```
有行列以及函数名，我们就需要把这些信息存到一个变量，那么就可以利用babel-types来生成真个变量对应AST节点了，点击[这里](https://babeljs.io/docs/en/next/babel-types.html#variabledeclaration)获取如何生成申明变量的节点，代码如下：
``` js
// 生成一个变量申明的AST节点 值包含了函数的行数，列数，和函数名
let infoDeclarator = types.variableDeclaration('var', [
    types.variableDeclarator(
      types.identifier('info'),
      types.ObjectExpression([
        types.objectProperty(types.identifier('line'), types.numericLiteral(node.loc.start.line)),
        types.objectProperty(types.identifier('row'), types.numericLiteral(node.loc.start.column)),
        types.objectProperty(types.identifier('function'), types.stringLiteral(funcName))
      ]))
]);
```
接着我们需要知道如何把处理异常的handler函数里面的内容转为catch里面的内容，这个时候就需要用到@babel/template包了，这里直接贴代码，怎么使用@babel/template，点击[这里](https://babeljs.io/docs/en/babel-template#templatestatement)。
```
// 将处理异常的handler转为AST节点
let catchStatement = template.statement(`var tmp = ${report.toString()}`)();
// 然后从AST节点中获取函数体 作为catch里面的内容
let catchBody = catchStatement.declarations[0].init.body ; 
```
report是处理异常的handler函数，实际运用的时候，应该开放给用户自定义。拿到catch里面的内容后，我们就可以根据babel-types去生成catch里面的内容了。

> 这里我是直接通过<code>var temp = code</code>的方式去生成一个函数表达式，然后来获取函数体里面的body节点，你当然也可以直接根据函数生成AST节点，然后去获取这个函数节点的body节点，不过你要考虑不同情况的函数定义，获取body的方式不同

```
let catchClause = types.catchClause(types.identifier('error'), 
// 第一个值是我们生成的包含行列以及函数名的变量
// 第二个值是handler的内容
types.blockStatement(
    [infoDeclarator, catchBody.body[0]]
));
let tryStatement = types.tryStatement(body, catchClause);
```
### 替换原来的函数内容
最后，我们就需要生成包含了try catch的新的函数替换原来函数，这里需要判断函数是怎么定义的，根据不同的定义，去生成不同的函数内容替换原来的。
```
let func = null;
// 区分是函数申明还是函数表达式
if (types.isFunctionDeclaration(node)) {
    func = types.functionDeclaration(node.id, node.params, types.BlockStatement([tryStatement]), node.generator, node.async);
} else {
    func = types.functionExpression(node.id, node.params, types.BlockStatement([tryStatement]), node.generator, node.async);
}
path.replaceWith(func);
```
### 防止circle loops以及过滤不需要try catch的函数内容
代码大体上是完成了，但是如果你试着去跑一下，你会发现，会发生死循环，原因就是替换的时候又会导致再次触发访问新的AST树，这样无限循环下去，所以我们需要把用try catch包裹后的AST树访问给跳过。 

如果函数里面的内容只是简单的一个值，那么也是不需要的，比如这样的
```
var test = () => 0
```
所以，我们的过滤条件是这样的
```
// 1、如果有try catch包裹了，则不需要 2、防止loops 3、需要try catch的只能是语句，像() => 0这种的body，是不需要的
if (blockStatement.body && types.isTryStatement(blockStatement.body[0])
    || !types.isBlockStatement(blockStatement) && !types.isExpressionStatement(blockStatement)) {
    return;
 }
```

贴上全部代码的git地址：https://github.com/VikiLee/TryCatchWrapper

### 其他
本篇文章未涉及到类方法以及简易对象方法（通过简洁方式定义的对象方法）方面到说明，这两种类型的方法通过FunctionExpression、FunctionDeclaration和ArrowFunctionExpression的访问器都是无法访问到的，所以无法包裹类方法和简易对象方法，但是git上的代码是已经考虑了类方法和简易对象方法的情况了。

### 参考链接:
[关于babel插件](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)  
[babel-type文档](https://babeljs.io/docs/en/next/babel-types.html)  
[@babel/template文档](https://note.youdao.com/)  
[AST可视化](https://astexplorer.net/)
