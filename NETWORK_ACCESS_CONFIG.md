# Film API - 网络访问配置

## 修改说明

已将 `film_api` 项目配置为可通过 IP 地址访问。

### 修改内容

**文件：`film_api/bin/www`**

```javascript
// 修改前
server.listen(port);

// 修改后
server.listen(port, "0.0.0.0", function () {
  console.log("Server listening on http://0.0.0.0:" + port);
  console.log("Access from network: http://<your-ip>:" + port);
});
```

### 使用方法

1. **启动服务**

   ```bash
   cd film_api
   npm start
   ```

2. **获取本机 IP 地址**

   Windows PowerShell:

   ```powershell
   ipconfig
   ```

   查找 "IPv4 地址" 或 "IPv4 Address"

   例如：`192.168.1.100`

3. **访问方式**

   - **本地访问**：`http://localhost:4000`
   - **局域网访问**：`http://192.168.1.100:4000` (替换为你的实际 IP)
   - **外网访问**：需要配置路由器端口转发

### 端口说明

- 默认端口：`4000`
- 可通过环境变量修改：`PORT=5000 npm start`

### 防火墙配置

如果无法访问，需要在 Windows 防火墙中允许端口 4000：

1. 打开 "Windows Defender 防火墙"
2. 点击 "高级设置"
3. 点击 "入站规则" -> "新建规则"
4. 选择 "端口" -> 下一步
5. 选择 "TCP" 和 "特定本地端口"，输入 `4000`
6. 选择 "允许连接" -> 下一步
7. 选择所有配置文件 -> 下一步
8. 输入名称 "Film API Port 4000" -> 完成

### 测试访问

从同一局域网的其他设备访问：

```bash
curl http://192.168.1.100:4000
```

或在浏览器中打开：`http://192.168.1.100:4000`

### CORS 配置

已配置允许所有来源跨域访问：

- `Access-Control-Allow-Origin: *`
- 支持的方法：GET, POST, PUT, DELETE, OPTIONS
- 允许携带凭证

### 注意事项

1. **0.0.0.0** 表示监听所有网络接口（IPv4）
2. 确保防火墙允许端口 4000
3. 局域网内其他设备需要知道服务器的 IP 地址
4. 外网访问需要配置路由器 NAT/端口转发

### 安全建议

生产环境建议：

1. 不要使用 `Access-Control-Allow-Origin: *`
2. 配置具体的允许域名
3. 使用 HTTPS
4. 添加认证和授权机制
5. 使用环境变量管理敏感配置
