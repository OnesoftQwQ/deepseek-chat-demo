import clsx from 'clsx'
import { useRef } from 'react'
import { useTranslate } from '../../i18n/index.js'
import { IconCloseOutline16 } from '../base/icons.js'
import { IconButton } from '../base/IconButton.js'
import { usePresence } from '../base/usePresence.js'
import { closeSearchPanel, useSearchPanel } from './searchPanelState.js'
import { SourceCard } from './SourceCard.js'
import styles from './SearchPanel.module.css'

/** 右侧「搜索结果」面板 */
export const SearchPanel = () => {
  const t = useTranslate()
  const entry = useSearchPanel((state) => state.entry)
  const sources = useSearchPanel((state) => state.sources)
  // 关闭时 sources 会被清空，退出动画期间沿用上一次的内容，避免面板先变空再滑出
  const { mounted, exiting } = usePresence(Boolean(entry), 160)
  const lastSources = useRef(sources)
  if (sources.length > 0) {
    lastSources.current = sources
  }
  if (!mounted) {
    return null
  }
  return (
    <aside className={clsx(styles.panel, exiting && styles.panelExit)}>
      <div className={styles.header}>
        <div role="heading" className={styles.title}>
          {t('searchResult')}
        </div>
        <IconButton
          icon={<IconCloseOutline16 />}
          aria-label={t('close')}
          onClick={closeSearchPanel}
        />
      </div>
      <div className={styles.content}>
        {(sources.length > 0 ? sources : lastSources.current).map((source) => (
          <SourceCard key={source.url} source={source} className={styles.item} />
        ))}
      </div>
    </aside>
  )
}
