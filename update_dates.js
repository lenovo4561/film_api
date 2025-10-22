// 更新数据库中的排片日期
const conn = require('./db/db');

console.log('开始更新排片日期...');

const updates = [
  "UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-5-', '2025-11-') WHERE show_date LIKE '2019-5-%'",
  "UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-7-', '2025-11-') WHERE show_date LIKE '2019-7-%'",
  "UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-8-', '2025-11-') WHERE show_date LIKE '2019-8-%'",
  "UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-9-', '2025-11-') WHERE show_date LIKE '2019-9-%'",
  "UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-11-', '2025-11-') WHERE show_date LIKE '2019-11-%'",
  "UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-12-', '2025-12-') WHERE show_date LIKE '2019-12-%'"
];

let completed = 0;

updates.forEach((sql, index) => {
  conn.query(sql, (error, result) => {
    if (error) {
      console.error(`更新失败 [${index + 1}]:`, error.message);
    } else {
      console.log(`✓ 更新成功 [${index + 1}]: ${result.affectedRows} 条记录被更新`);
    }
    
    completed++;
    if (completed === updates.length) {
      // 查询更新后的数据
      conn.query('SELECT schedule_id, movie_id, show_date, show_time FROM t_schedule ORDER BY show_date, show_time LIMIT 10', (error, result) => {
        if (error) {
          console.error('查询失败:', error.message);
        } else {
          console.log('\n更新后的排片信息（前10条）:');
          console.table(result);
        }
        conn.end();
        console.log('\n数据库连接已关闭');
      });
    }
  });
});
