// 更新所有2019年的日期为2025年
const conn = require('./db/db');

setTimeout(() => {
  console.log('开始更新所有2019年的排片日期为2025年...');
  
  const sql = "UPDATE t_schedule SET show_date = REPLACE(show_date, '2019-', '2025-') WHERE show_date LIKE '2019-%'";
  
  conn.query(sql, (error, result) => {
    if (error) {
      console.error('更新失败:', error.message);
    } else {
      console.log(`✓ 成功更新 ${result.affectedRows} 条记录`);
    }
    
    // 查询验证
    conn.query('SELECT schedule_id, movie_id, show_date, show_time FROM t_schedule ORDER BY show_date, show_time', (error, result) => {
      if (error) {
        console.error('查询失败:', error.message);
      } else {
        console.log('\n所有排片信息:');
        console.table(result);
        
        // 检查是否还有2019年的数据
        const old = result.filter(r => r.show_date.includes('2019'));
        if (old.length > 0) {
          console.log('\n⚠ 仍有', old.length, '条2019年的数据');
        } else {
          console.log('\n✓ 所有日期已更新为2025年!');
        }
      }
      conn.end();
    });
  });
}, 1000);
