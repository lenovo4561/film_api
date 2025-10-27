const axios = require("axios");

const testData = {
  userId: "55",
  taskId: "14",
  orderId: `TEST_${Date.now()}`,
  coins: 10,
  totalCount: 2,
  completedCount: 1,
  timestamp: Date.now(),
  timezone: "Asia/Shanghai",
};

console.log("========== 测试回调接口 ==========\n");
console.log("测试数据:", JSON.stringify(testData, null, 2));

axios
  .post("http://localhost:4000/api/task/callback", testData, {
    headers: {
      "Content-Type": "application/json",
    },
  })
  .then((response) => {
    console.log("\n✅ 请求成功!");
    console.log("状态码:", response.status);
    console.log("响应数据:", JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log("\n🎉 回调接口工作正常！");
    } else {
      console.log("\n⚠️ 回调失败:", response.data.message);
    }
  })
  .catch((error) => {
    console.error("\n❌ 请求失败!");
    if (error.response) {
      console.error("状态码:", error.response.status);
      console.error("响应数据:", error.response.data);
    } else if (error.request) {
      console.error("无响应，可能是服务未启动");
    } else {
      console.error("错误:", error.message);
    }
  });
