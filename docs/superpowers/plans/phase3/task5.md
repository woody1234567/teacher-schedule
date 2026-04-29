## Task 5: 實現實時更新系統（Server-Sent Events）

### 檔案：
- Create: `server/api/events/stream.get.ts`
- Create: `app/composables/useRealtimeUpdates.ts`

- [ ] **Step 1: 建立 SSE 流端點**

建立 `server/api/events/stream.get.ts`：

```typescript
export default defineEventHandler(async (event) => {
  // 設置 SSE 響應頭
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')

  // 創建一個簡單的事件流模擬
  // 在實際應用中，可以使用消息隊列或數據庫訂閱
  
  const send = (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`
    event.node.res.write(message)
  }

  // 發送初始連接確認
  send({ type: 'connected', timestamp: new Date() })

  // 保持連接打開
  const interval = setInterval(() => {
    send({ type: 'ping', timestamp: new Date() })
  }, 30000) // 每 30 秒發送一次心跳

  // 監聽客戶端斷開連接
  event.node.req.on('close', () => {
    clearInterval(interval)
    event.node.res.end()
  })

  // 返回流
  return new Promise(() => {})
})
```

- [ ] **Step 2: 建立實時更新組合函數**

建立 `app/composables/useRealtimeUpdates.ts`：

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

export interface RealtimeEvent {
  type: 'booking_request' | 'booking_approved' | 'event_created' | 'event_updated' | 'event_deleted' | 'ping' | 'connected'
  data?: any
  timestamp: string
}

export const useRealtimeUpdates = () => {
  const events = ref<RealtimeEvent[]>([])
  const isConnected = ref(false)
  let eventSource: EventSource | null = null

  const connect = () => {
    if (eventSource) return

    eventSource = new EventSource('/api/events/stream')

    eventSource.onopen = () => {
      isConnected.value = true
      console.log('Connected to realtime updates')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        events.value.push(data)

        // 發出自定義事件供其他組件監聽
        window.dispatchEvent(
          new CustomEvent('realtime-event', { detail: data })
        )
      } catch (err) {
        console.error('Failed to parse realtime event:', err)
      }
    }

    eventSource.onerror = () => {
      isConnected.value = false
      console.error('Realtime connection error, attempting to reconnect...')
      setTimeout(connect, 5000) // 5 秒後重新連接
    }
  }

  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
      isConnected.value = false
    }
  }

  const listen = (eventType: string, callback: (event: RealtimeEvent) => void) => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<RealtimeEvent>
      if (customEvent.detail.type === eventType) {
        callback(customEvent.detail)
      }
    }

    window.addEventListener('realtime-event', handler)

    return () => {
      window.removeEventListener('realtime-event', handler)
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    events,
    isConnected,
    connect,
    disconnect,
    listen,
  }
}
```

- [ ] **Step 3: 在教師請求頁面集成實時更新**

修改 `app/pages/teacher/requests.vue`，添加實時監聽：

```typescript
<script setup lang="ts">
import { onMounted } from 'vue'
import { useBookings } from '~/composables/useBookings'
import { useRealtimeUpdates } from '~/composables/useRealtimeUpdates'

const bookings = useBookings()
const realtime = useRealtimeUpdates()

onMounted(async () => {
  await bookings.fetchBookingRequests()
  
  // 監聽新的預約請求
  realtime.listen('booking_request', async () => {
    await bookings.fetchBookingRequests()
  })
})
</script>
```

- [ ] **Step 4: 提交**

```bash
git add server/api/events/stream.get.ts app/composables/useRealtimeUpdates.ts
git commit -m "feat: implement Server-Sent Events for realtime updates"
```

