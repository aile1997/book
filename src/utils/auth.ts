// src/utils/auth.ts

export interface LarkUserInfo {
  name: string
  avatar_url: string
  open_id: string
}

export const getLarkCode = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.h5sdk) {
      return reject(new Error('非飞书环境或 SDK 未加载'))
    }
    // 确保 SDK 初始化完成
    window.h5sdk.ready(() => {
      tt.requestAuthCode({
        appId: import.meta.env.VITE_LARK_APP_ID, // 在 .env 中配置 cli_xxx
        scopeList: [],
        success: (res) => {
          console.log('Code 获取成功:', res.code)
          resolve(res.code)
        },
        fail: (err) => {
          console.error('Code 获取失败:', err)
          alert(err)
          reject(err)
        },
      })
    })
  })
}

/**
 * 后端登录对接
 * @param code 授权码
 */
export const loginWithBackend = async (code: string) => {
  // 注意：这里使用的是我们之前配置的 Vite Proxy 路径 /api
  const response = await fetch('api/v1/auth/feishu/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // 针对 ngrok 必带
    },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) throw new Error('后端登录失败')
  return await response.json()
}
