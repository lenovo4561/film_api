// 测试回调接口完整流程
const axios = require("axios");

async function testCallbackFlow() {
  console.log("========== 测试任务回调流程 ==========\n");

  // 模拟从 server 服务接收到的回调数据
  const callbackData = {
    userId: "55", // 用户ID
    taskId: "1", // 任务ID
    orderId: `ORD${Date.now()}TEST`, // 订单ID（唯一标识）
    coins: 100, // 奖励金币数
    totalCount: 10, // 任务总次数
    completedCount: 1, // 已完成次数
    timestamp: Date.now(), // 时间戳（毫秒）
    timezone: "Asia/Shanghai", // 时区
  };

  console.log("1. 准备发送回调请求到 film_api");
  console.log("   回调数据:", callbackData);
  console.log("");

  try {
    // 发送回调请求到 film_api
    const response = await axios.post(
      "http://localhost:4000/api/task/callback",
      callbackData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("2. ✅ 回调请求成功");
    console.log("   响应状态:", response.status);
    console.log("   响应数据:", response.data);
    console.log("");

    if (response.data.success) {
      console.log("3. ✅ 金币发放成功！");
      console.log(
        `   用户 ${response.data.data.userId} 获得 ${response.data.data.coins} 金币`
      );
      console.log(`   新余额: ${response.data.data.newBalance} 金币`);
      console.log(`   订单号: ${response.data.data.orderId}`);
    } else {
      console.log("3. ❌ 金币发放失败");
      console.log("   错误信息:", response.data.message);
    }

    console.log("");
    console.log("========== 测试完成 ==========");
  } catch (error) {
    console.error("❌ 请求失败:", error.message);
    console.error("   错误堆栈:", error.stack);
    if (error.response) {
      console.error("   响应状态:", error.response.status);
      console.error("   响应数据:", error.response.data);
    }
    if (error.code) {
      console.error("   错误代码:", error.code);
    }
  }
}

// 执行测试
testCallbackFlow();
