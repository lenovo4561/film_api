/**
 * 测试 last_total_balance 字段的更新逻辑
 * 验证金币变动时是否正确记录变动前的余额
 */

const mysql = require("mysql2/promise");
const axios = require("axios");

const filmDbConfig = {
  host: "localhost",
  user: "root",
  password: "13249709366",
  database: "db_film",
};

const testUserId = 55;

async function testLastTotalBalance() {
  const pool = await mysql.createPool(filmDbConfig);

  try {
    console.log("=".repeat(80));
    console.log("测试 last_total_balance 字段更新逻辑");
    console.log("=".repeat(80));
    console.log("");

    // 1. 查询当前金币数据
    console.log("步骤 1: 查询当前金币数据...");
    const [userCoinsBefore] = await pool.query(
      "SELECT user_id, coin_balance, total_earned, last_total_balance, updated_at FROM t_user_coins WHERE user_id = ?",
      [testUserId]
    );

    if (userCoinsBefore.length === 0) {
      console.log(`⚠️  用户 ${testUserId} 的金币记录不存在`);
      console.log("");
      return;
    }

    const before = userCoinsBefore[0];
    console.log("变动前的数据:");
    console.log(`  - 用户ID: ${before.user_id}`);
    console.log(`  - 当前余额 (coin_balance): ${before.coin_balance}`);
    console.log(`  - 累计收益 (total_earned): ${before.total_earned}`);
    console.log(
      `  - 上次余额 (last_total_balance): ${before.last_total_balance}`
    );
    console.log(`  - 更新时间: ${before.updated_at}`);
    console.log("");

    // 2. 检查回调接口是否可用
    console.log("步骤 2: 检查回调接口状态...");
    try {
      await axios.get("http://localhost:4000", { timeout: 2000 });
      console.log("✅ film_api 服务正在运行");
    } catch (error) {
      console.log("❌ film_api 服务未运行，无法测试回调");
      console.log("   请先启动 film_api 服务: cd film_api && npm start");
      console.log("");
      return;
    }
    console.log("");

    // 3. 模拟回调测试
    console.log("步骤 3: 模拟回调请求...");
    const testOrderId = `TEST_LAST_BALANCE_${Date.now()}`;
    const testCoins = 15; // 测试奖励 15 金币

    console.log(`准备发送回调请求:`);
    console.log(`  - 订单ID: ${testOrderId}`);
    console.log(`  - 用户ID: ${testUserId}`);
    console.log(`  - 奖励金币: ${testCoins}`);
    console.log("");

    try {
      const response = await axios.post(
        "http://localhost:4000/api/task/callback",
        {
          userId: testUserId.toString(),
          orderId: testOrderId,
          coins: testCoins,
          taskId: 14,
          totalCount: 5,
          completedCount: 3,
          timestamp: Date.now(),
          timezone: "Asia/Shanghai",
        }
      );

      if (response.data.success) {
        console.log("✅ 回调成功");
        console.log("响应数据:", response.data.data);
      } else {
        console.log("❌ 回调失败:", response.data.message);
        return;
      }
    } catch (error) {
      console.error("❌ 回调请求失败:", error.message);
      return;
    }
    console.log("");

    // 4. 等待数据库更新
    console.log("等待数据库更新...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("");

    // 5. 查询更新后的金币数据
    console.log("步骤 4: 查询更新后的金币数据...");
    const [userCoinsAfter] = await pool.query(
      "SELECT user_id, coin_balance, total_earned, last_total_balance, updated_at FROM t_user_coins WHERE user_id = ?",
      [testUserId]
    );

    const after = userCoinsAfter[0];
    console.log("变动后的数据:");
    console.log(`  - 用户ID: ${after.user_id}`);
    console.log(`  - 当前余额 (coin_balance): ${after.coin_balance}`);
    console.log(`  - 累计收益 (total_earned): ${after.total_earned}`);
    console.log(
      `  - 上次余额 (last_total_balance): ${after.last_total_balance}`
    );
    console.log(`  - 更新时间: ${after.updated_at}`);
    console.log("");

    // 6. 验证逻辑
    console.log("步骤 5: 验证更新逻辑...");
    console.log("");

    const coinBalanceChange = after.coin_balance - before.coin_balance;
    const totalEarnedChange = after.total_earned - before.total_earned;

    console.log("📊 金币变化分析:");
    console.log(
      `  - coin_balance 变化: ${before.coin_balance} → ${after.coin_balance} (${
        coinBalanceChange >= 0 ? "+" : ""
      }${coinBalanceChange})`
    );
    console.log(
      `  - total_earned 变化: ${before.total_earned} → ${after.total_earned} (${
        totalEarnedChange >= 0 ? "+" : ""
      }${totalEarnedChange})`
    );
    console.log(
      `  - last_total_balance: ${before.last_total_balance} → ${after.last_total_balance}`
    );
    console.log("");

    // 验证 last_total_balance 是否等于变动前的 coin_balance
    if (after.last_total_balance === before.coin_balance) {
      console.log("✅ last_total_balance 正确记录了变动前的余额");
      console.log(`   变动前余额: ${before.coin_balance}`);
      console.log(`   last_total_balance: ${after.last_total_balance}`);
    } else {
      console.log("❌ last_total_balance 记录不正确");
      console.log(`   变动前余额: ${before.coin_balance}`);
      console.log(`   last_total_balance: ${after.last_total_balance}`);
    }
    console.log("");

    // 验证金币增加是否正确
    if (coinBalanceChange === testCoins) {
      console.log(`✅ coin_balance 增加了 ${testCoins} 金币（正确）`);
    } else {
      console.log(
        `❌ coin_balance 增加了 ${coinBalanceChange} 金币（预期 ${testCoins}）`
      );
    }

    if (totalEarnedChange === testCoins) {
      console.log(`✅ total_earned 增加了 ${testCoins} 金币（正确）`);
    } else {
      console.log(
        `❌ total_earned 增加了 ${totalEarnedChange} 金币（预期 ${testCoins}）`
      );
    }
    console.log("");

    // 7. 总结
    console.log("=".repeat(80));
    console.log("测试总结");
    console.log("=".repeat(80));
    console.log("");
    console.log("✅ last_total_balance 字段更新逻辑:");
    console.log(
      "   1. 在更新金币之前，先将当前 coin_balance 的值保存到 last_total_balance"
    );
    console.log("   2. 然后更新 coin_balance 和 total_earned");
    console.log("   3. 这样可以追踪用户每次金币变动前的余额");
    console.log("");
    console.log("💡 使用场景:");
    console.log("   - 计算金币变化量: coin_balance - last_total_balance");
    console.log('   - 显示"余额从 XXX 变为 YYY"');
    console.log("   - 用户余额历史追踪");
    console.log("   - 异常检测（变动是否合理）");
    console.log("");
  } catch (error) {
    console.error("测试过程出错:", error);
  } finally {
    await pool.end();
  }
}

// 运行测试
testLastTotalBalance().catch(console.error);
