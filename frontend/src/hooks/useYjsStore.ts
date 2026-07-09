import { useEffect, useState } from 'react'
import {
  createTLStore,
  defaultShapeUtils,
  TLAnyShapeUtilConstructor,
  TLRecord,
  TLStoreWithStatus,
} from 'tldraw'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const emptyArray: TLAnyShapeUtilConstructor[] = []

export function useYjsStore({
  roomId = 'brainforge-room-1',
  hostUrl = 'ws://localhost:1234',
  shapeUtils = emptyArray,
  userProfile,
}: {
  roomId?: string
  hostUrl?: string
  shapeUtils?: TLAnyShapeUtilConstructor[]
  userProfile?: { name: string, color: string }
}) {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  })
  
  // Track active users from Yjs awareness
  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string; color: string }[]>([])

  // Use stringified userProfile to prevent unnecessary re-renders on object reference change
  const userProfileString = userProfile ? JSON.stringify(userProfile) : null

  useEffect(() => {
    let hasUnmounted = false
    const yDoc = new Y.Doc()
    const yMap = yDoc.getMap<TLRecord>(roomId)
    const provider = new WebsocketProvider(hostUrl, roomId, yDoc, {
      connect: true,
    })

    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    })

    yMap.observe((event, transaction) => {
      if (hasUnmounted) return
      if (transaction.local) return
      const changes: any = { added: {}, updated: {}, removed: {} }
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') changes.added[key] = yMap.get(key)!
        else if (change.action === 'update') changes.updated[key] = [change.oldValue, yMap.get(key)!]
        else if (change.action === 'delete') changes.removed[key] = change.oldValue
      })

      store.mergeRemoteChanges(() => {
        if (Object.keys(changes.added).length > 0) {
          store.put(Object.values(changes.added) as any)
        }
        if (Object.keys(changes.updated).length > 0) {
          store.put(Object.values(changes.updated).map((r: any) => r[1]) as any)
        }
        if (Object.keys(changes.removed).length > 0) {
          store.remove(Object.keys(changes.removed) as any)
        }
      })
    })

    store.mergeRemoteChanges(() => {
      const initialRecords = Array.from(yMap.values())
      if (initialRecords.length > 0) store.put(initialRecords)
    })
    
    setTimeout(() => {
      if (!hasUnmounted) {
        setStoreWithStatus({ status: 'synced-remote', connectionStatus: 'online', store })
      }
    }, 0)

    const unlisten = store.listen(
      (update) => {
        if (update.source !== 'user') return
        yDoc.transact(() => {
          Object.values(update.changes.added).forEach((record) => yMap.set(record.id, record))
          Object.values(update.changes.updated).forEach(([_, record]) => yMap.set(record.id, record))
          Object.values(update.changes.removed).forEach((record) => yMap.delete(record.id))
        })
      },
      { source: 'user', scope: 'document' }
    )

    // Set local presence user info if provided
    if (userProfileString) {
      provider.awareness.setLocalStateField('user', JSON.parse(userProfileString))
    }

    const unlistenPresence = store.listen(
      (update) => {
        if (update.source !== 'user') return
        const presenceRecords = Object.values(update.changes.added)
          .concat(Object.values(update.changes.updated).map((u) => u[1]))
          .filter((r) => r.typeName === 'instance_presence')
          
        if (presenceRecords.length > 0) {
          provider.awareness.setLocalStateField('presence', presenceRecords[0])
        }
      },
      { source: 'user', scope: 'presence' }
    )

    let knownRemotePresenceIds = new Set<string>()

    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates()
      const currentRemoteIds = new Set<string>()
      const presencesToPut: TLRecord[] = []
      const users: { id: string; name: string; color: string }[] = []

      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({ id: clientId.toString(), name: state.user.name, color: state.user.color })
        }
        if (clientId !== provider.awareness.clientID && state.presence) {
          let presence = state.presence
          if (state.user) {
             presence = { 
               ...presence, 
               id: `instance_presence:${clientId}`, // Force unique presence ID
               userId: `user:${clientId}`,          // Force unique user ID
               userName: state.user.name, 
               color: state.user.color 
             }
          }
          
          currentRemoteIds.add(presence.id)
          presencesToPut.push(presence)
        }
      })
      
      setActiveUsers(users)

      store.mergeRemoteChanges(() => {
        knownRemotePresenceIds.forEach((id) => {
          if (!currentRemoteIds.has(id)) store.remove([id as any])
        })
        if (presencesToPut.length > 0) store.put(presencesToPut)
      })
      
      knownRemotePresenceIds = currentRemoteIds
    })

    return () => {
      hasUnmounted = true
      unlisten()
      unlistenPresence()
      provider.disconnect()
      provider.destroy()
      yDoc.destroy()
    }
  }, [hostUrl, roomId, shapeUtils, userProfileString])

  return { storeWithStatus, activeUsers }
}

