# Film API - 登录验证码移除说明

## 修改内容

### 文件：`film_api/routes/index.js`

**接口：`POST /api/pwdLogin` - 账号密码登录**

#### 修改前

```javascript
router.post("/api/pwdLogin", function (req, res) {
  let name = req.body.userName;
  let pwd = req.body.password;
  let captcha = req.body.captcha;

  //判断验证码是否正确
  if (captcha.toLowerCase() !== req.session.captcha) {
    res.json({ error_code: 1, message: "验证码不正确" });
  } else {
    delete req.session.captcha;
    // ... 账号密码验证逻辑
  }
});
```

#### 修改后

```javascript
router.post("/api/pwdLogin", function (req, res) {
  let name = req.body.userName;
  let pwd = req.body.password;
  let captcha = req.body.captcha;

  // 注释掉验证码校验逻辑 - 只需账号密码即可登录
  // //判断验证码是否正确
  // if (captcha.toLowerCase() !== req.session.captcha) {
  //   res.json({ error_code: 1, message: "验证码不正确" });
  // } else {
  //   delete req.session.captcha;

  // 直接进行账号密码验证
  // ... 账号密码验证逻辑

  // } // 注释掉的验证码校验结束
});
```

## 功能说明

### 已修改接口

- ✅ **`POST /api/pwdLogin`** - 账号密码登录（已移除验证码校验）

### 未修改接口（保持原样）

- 📱 **`POST /api/phoneLogin`** - 手机号登录（保留短信验证码校验）
- 👨‍💼 **`POST /api/admin/login`** - 管理员登录（原本就没有验证码）

## 使用方法

### 登录请求

**请求地址**

```
POST http://localhost:4000/api/pwdLogin
```

**请求参数**

```json
{
  "userName": "用户名",
  "password": "密码",
  "captcha": "" // 可以为空或任意值，已不再校验
}
```

**成功响应**

```json
{
  "success_code": 200
}
```

**失败响应**

```json
{
  "error_code": 1,
  "message": "密码错误" // 或 "用户不存在"
}
```

## 重启服务

修改后需要重启 film_api 服务：

```bash
cd film_api
npm start
```

或使用重启脚本：

```bash
restart-film-api.bat
```

## 注意事项

1. **验证码字段仍然存在**：前端仍可以传递 `captcha` 字段，但后端不会校验
2. **Session 管理**：成功登录后仍会设置 session 和 cookie
3. **安全性**：移除验证码后，建议添加其他安全措施（如登录频率限制、IP 白名单等）

## 前端调用示例

```javascript
// 登录请求
axios
  .post("/api/pwdLogin", {
    userName: "用户名",
    password: "密码",
    captcha: "", // 不再需要真实验证码
  })
  .then((response) => {
    if (response.data.success_code === 200) {
      console.log("登录成功");
    } else {
      console.log("登录失败：" + response.data.message);
    }
  })
  .catch((error) => {
    console.error("请求失败", error);
  });
```

## 恢复验证码功能

如果将来需要恢复验证码功能，只需：

1. 取消注释验证码校验代码
2. 重启服务即可

---

修改日期：2025-10-29
