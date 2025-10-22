const conn = require('./db/db');

conn.query('DESCRIBE t_user', (err, result) => {
  if (err) {
    console.log('错误:', err.message);
  } else {
    console.log('t_user 表结构：\n');
    result.forEach(field => {
      console.log(`${field.Field}: ${field.Type} ${field.Key ? '(' + field.Key + ')' : ''}`);
    });
  }
  conn.end();
});
