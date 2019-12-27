
var fs = require('fs');
var babel = require('babel-core'); // babel核心库
var types = require('babel-types');
var template = require("@babel/template");
var code = fs.readFileSync('./code.js', 'utf-8');

// 这个是catch里面的内容，这里只是例子，实际情况看项目需求，或者写个webpack-loader/babel-plugin去开放给用户定义
function report(info) {
  console.log(info, error);
  console.log(111);
}

function getFilename(filename) {
  return filename.replace(process.cwd(), '')
}

function generateTryCatch(path, filename) {
  try {
    var node = path.node;
    var params = node.params;
    var blockStatement = node.body;

    // get function name
    var funcName = 'anonymous function';
    if (node.id) {
      funcName = node.id.name
    } else if (node.key) {
      // class method name
      funcName = node.key.name
    }
    if (funcName === 'anonymous function') {
      if (types.isVariableDeclarator(path.parentPath)) {
        funcName = path.parentPath.node.id.name;
      } else if (types.isProperty(path.parentPath)) {
        funcName = path.parentPath.node.key.name;
      }   
    }

    var isGenerator = node.generator;
    var isAsync = node.async;

    // 1、如果有try catch包裹了，则不需要 2、防止circle loops 3、需要try catch的只能是语句，像() => 0这种的body，是不需要的
    if (blockStatement.body && types.isTryStatement(blockStatement.body[0])
      || !types.isBlockStatement(blockStatement) && !types.isExpressionStatement(blockStatement)) {
      return;
    }
    // 将catch handler转为AST节点 然后从AST节点中获取函数体 作为catch里面的内容
    var catchStatement = template.statement(`var tmp = ${report.toString()}`)();
    var catchBody = catchStatement.declarations[0].init.body; 

    // 赋值语句 值包含了函数的行列数和函数名
    var infoDeclarator = types.variableDeclaration('var', [
      types.variableDeclarator(
        types.identifier('info'),
        types.ObjectExpression([
          types.objectProperty(types.identifier('line'), types.numericLiteral(node.loc.start.line)),
          types.objectProperty(types.identifier('row'), types.numericLiteral(node.loc.start.column)),
          types.objectProperty(types.identifier('function'), types.stringLiteral(funcName)),
          types.objectProperty(types.identifier('filename'), types.stringLiteral(getFilename(filename)))
        ]))
    ]);

    var catchClause = types.catchClause(types.identifier('error'), types.blockStatement(
      [infoDeclarator].concat(catchBody.body)
    ));
    var tryStatement = types.tryStatement(blockStatement, catchClause);

    var func = null;
    // 区分类方法、对象方法、函数申明还是函数表达式
    if (types.isClassMethod(node)) {
      func = types.classMethod(node.kind, node.key, params, types.BlockStatement([tryStatement]), node.computed, node.static);
    } else if (types.isObjectMethod(node)) {
      func = types.objectMethod(node.kind, node.key, params, types.BlockStatement([tryStatement]), node.computed);
    } else if (types.isFunctionDeclaration(node)) {
      func = types.functionDeclaration(node.id, params, types.BlockStatement([tryStatement]), isGenerator, isAsync);
    } else {
      func = types.functionExpression(node.id, params, types.BlockStatement([tryStatement]), isGenerator, isAsync);
    }
    path.replaceWith(func);
  } catch(error) {
    throw error;
  }
}

var visitor = {
  'ArrowFunctionExpression|FunctionExpression|FunctionDeclaration': function(path, state) {
    generateTryCatch(path, state.file.opts.filename);
  },
  ClassDeclaration(path, state) {
    path.traverse({
      ClassMethod(path) {
        generateTryCatch(path, state.file.opts.filename);
      }
    });
  },
  ObjectExpression(path, state) {
    path.traverse({
      ObjectMethod(path) {
        generateTryCatch(path, state.file.opts.filename);
      }
    });
  }
}

var babelPlugin = { visitor }
var result = babel.transform(code, {
  plugins: [
    babelPlugin
  ]
})
console.log(result.code)

