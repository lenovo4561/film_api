# 测试任务回调接口

Write-Host "========== 测试任务回调接口 ==========" -ForegroundColor Cyan
Write-Host ""

# 生成唯一订单号
$timestamp = [Math]::Floor((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalMilliseconds)
$orderId = "ORD${timestamp}TEST"

Write-Host "准备发送回调请求..." -ForegroundColor Yellow
Write-Host "订单号: $orderId" -ForegroundColor White

# 构造请求数据
$body = @{
    userId = "55"
    taskId = "1"
    orderId = $orderId
    coins = 100
    totalCount = 10
    completedCount = 1
    timestamp = $timestamp
    timezone = "Asia/Shanghai"
} | ConvertTo-Json

Write-Host "请求数据:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    # 发送请求
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/task/callback" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "✅ 请求成功！" -ForegroundColor Green
    Write-Host "响应状态: $($response.StatusCode)" -ForegroundColor White
    Write-Host "响应数据:" -ForegroundColor Yellow
    Write-Host $response.Content -ForegroundColor White
    
} catch {
    Write-Host "❌ 请求失败！" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "响应状态: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
