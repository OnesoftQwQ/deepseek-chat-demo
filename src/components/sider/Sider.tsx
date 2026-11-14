import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import { IconPanelLeftOutline16, IconSettingsOutline16, NewChatIcon } from '../base/icons.js'
import { setSiderCollapsed } from '../../services/settings.js'
import { groupSessions } from '../../services/chat/sessionGroups.js'
import { newChat, removeSession, useChatStore } from '../../services/chat/store.js'
import type { SessionSummary } from '../../services/chat/types.js'
import { Button } from '../base/Button.js'
import { IconButton } from '../base/IconButton.js'
import { Modal } from '../base/Modal.js'
import { showToast } from '../base/toastState.js'
import { openSettings } from '../settings/settingsDialogState.js'
import { closeMobileSider, useMobileSider } from './mobileSiderState.js'
import { SessionItem } from './SessionItem.js'
import styles from './Sider.module.css'

/** 展开的侧边栏：名称与收起按钮、开启新对话、按时间分组的会话列表、底部设置；移动端放在抽屉里，收起按钮关闭抽屉 */
export const Sider = ({
  mobile = false,
  collapsed = false,
}: {
  mobile?: boolean
  /** 桌面端收起状态：宽度收为零，内容淡出，展开与收起之间平滑过渡 */
  collapsed?: boolean
}) => {
  const t = useTranslate()
  const sessions = useChatStore((state) => state.sessions)
  const activeId = useChatStore((state) => state.activeId)
  const [now, setNow] = useState(Date.now)
  const groups = useMemo(() => groupSessions(sessions, now, t), [sessions, now, t])
  const [deleting, setDeleting] = useState<SessionSummary | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 收起后内容仍留在 DOM 里做过渡，用 inert 把它移出焦点顺序和点击命中
  useEffect(() => {
    const element = wrapRef.current
    if (element) {
      element.inert = collapsed && !mobile
    }
  }, [collapsed, mobile])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      const time = Date.now()
      setNow(time)
      const midnight = new Date(time).setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, midnight - time)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    refresh()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className={clsx(
        styles.siderWrap,
        mobile && styles.mobile,
        collapsed && !mobile && styles.siderWrapCollapsed
      )}
    >
      <div className={styles.sider}>
        <div className={styles.top}>
          <div className={styles.appName}>{t('appName')}</div>
          <IconButton
            size="m"
            icon={<IconPanelLeftOutline16 />}
            tooltip={t('collapseSiderbarButton')}
            tooltipPlacement="bottom"
            onClick={() => (mobile ? closeMobileSider() : setSiderCollapsed(true))}
          />
        </div>
        <button
          type="button"
          className={styles.newChat}
          onClick={() => {
            newChat()
            closeMobileSider()
          }}
        >
          <span className={styles.newChatIcon}>
            <NewChatIcon />
          </span>
          {t('newChat')}
        </button>
        <div className={styles.listWrap}>
          <div className={styles.list}>
            {groups.map((group) => (
              <div key={group.key} className={styles.section}>
                <div className={styles.sectionHeader}>{group.label}</div>
                {group.sessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    active={session.id === activeId}
                    onDelete={() => setDeleting(session)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.bottom}>
          <button type="button" className={styles.settings} onClick={() => openSettings('general')}>
            <span className={styles.settingsIcon}>
              <IconSettingsOutline16 />
            </span>
            <span className={styles.settingsLabel}>{t('settings')}</span>
          </button>
        </div>
        {deleting ? (
          <Modal
            title={t('deleteSessionModalContentTitle')}
            onClose={() => {
              if (!deletePending) {
                setDeleting(null)
              }
            }}
            footer={
              <>
                <Button
                  variant="outlined"
                  disabled={deletePending}
                  onClick={() => setDeleting(null)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="danger"
                  disabled={deletePending}
                  onClick={async () => {
                    setDeletePending(true)
                    try {
                      if (await removeSession(deleting.id)) {
                        setDeleting(null)
                      } else {
                        showToast({ key: 'sessionDeleteFailed', type: 'error' })
                      }
                    } finally {
                      setDeletePending(false)
                    }
                  }}
                >
                  {t('delete')}
                </Button>
              </>
            }
          >
            {t('deleteSessionWithFilesDescription')}
          </Modal>
        ) : null}
      </div>
    </div>
  )
}

/** 移动端抽屉：浮在页面上方，点空白区域关闭。 */
export const MobileSider = () => {
  const open = useMobileSider((state) => state.open)
  if (!open) {
    return null
  }
  return (
    <>
      <div className={styles.drawerMask} onClick={closeMobileSider} />
      <div className={styles.drawer}>
        <Sider mobile />
      </div>
    </>
  )
}
