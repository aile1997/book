// src/utils/auth.ts

export const feishuLogin = () => {
  return new Promise((resolve, reject) => {
    // 1. 判断是否在飞书环境下
    if (!window.tt || !window.tt.requestAuthCode) {
      console.error('非飞书环境，请在飞书客户端打开')
      return reject('NOT_IN_LARK')
    }

    // 2. 调用飞书接口获取临时授权码 code
    window.tt.requestAuthCode({
      appId: 'cli_a9c2b23bed389bd7', // 你的 App ID
      success: async (res) => {
        const code = res.code
        console.log('获取 code 成功:', code)

        try {
          // 3. 将 code 发送给你的后端换取登录信息
          // 注意：这里使用你配置好的 Vite 代理路径 /api
          const loginResult = await fetch('/api/v1/auth/lark-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          }).then((r) => r.json())

          // 4. 保存后端返回的 Token（例如 Bearer Token）
          if (loginResult.token) {
            localStorage.setItem('auth_token', loginResult.token)
            resolve(loginResult.user)
          }
        } catch (err) {
          reject(err)
        }
      },
      fail: (err) => {
        console.error('获取 code 失败:', err)
        reject(err)
      },
    })
  })
}
