var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//托管静态文件
app.use(express.static('public'));

//
app.use(session({
  secret: 'keyboard cat', // 对session id 相关的cookie 进行签名
  resave: false,
  saveUninitialized: true, // 是否保存未初始化的会话
  cookie : {maxAge : 1000 * 60 * 60 * 24}, // 设置 session 的有效时间，单位毫秒},
}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//设置跨域 - 必须在路由之前
app.all("*", function(req, res, next) {
  // 允许所有来源
  res.set("Access-Control-Allow-Origin","*");
  // 允许的HTTP方法
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  // 允许的请求头
  res.set("Access-Control-Allow-Headers", "X-Requested-With,Origin,Content-Type,Accept,Authorization");
  // 允许携带cookie
  res.set("Access-Control-Allow-Credentials", "true");
  // 预检请求缓存时间
  res.set('Access-Control-Max-Age', '3600');
  // 处理预检请求
  if ("OPTIONS" === req.method) return res.sendStatus(200);
  next();
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 启动服务器
// var port = process.env.PORT || 3000;
var port = 4000;
app.listen(port, function() {
  console.log('服务器已启动，监听端口: ' + port);
});

module.exports = app;
