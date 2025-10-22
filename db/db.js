const mysql = require('mysql2');

const conn = mysql.createConnection({
   host:'localhost',    //数据库地址
   user:'root', //用户名
   password:'13249709366', //密码
   database:'db_film' //数据库名
});

conn.connect((err) => {
   if (err) {
      console.error('数据库连接失败:', err.message);
      return;
   }
   console.log('数据库连接成功!');
});

module.exports = conn;