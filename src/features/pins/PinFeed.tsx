import { useEffect, useRef, useState } from 'react'
import PinCard from './PinCard'
import { fetchPins } from './pinsSlice'
import { useAppSelector, useAppDispatch } from '../../shared/hooks/redux'

const SKELETON_HEIGHTS = [220, 290, 175, 340, 250, 195, 270, 215, 310, 180, 235, 300, 245, 185, 265, 205]

function PinFeed() {
  const dispatch = useAppDispatch()
  const items   = useAppSelector((state) => state.pins.items)
  const status  = useAppSelector((state) => state.pins.status)
  const error   = useAppSelector((state) => state.pins.error)
  const page    = useAppSelector((state) => state.pins.page)
  const hasMore = useAppSelector((state) => state.pins.hasMore)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth)

  // Responsive column count
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const columnCount = windowWidth < 600 ? 2 : windowWidth < 900 ? 3 : 4

  // Trigger first fetch when status is idle (also fires after resetPins)
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPins(page))
    }
  }, [dispatch, page, status])

  // Infinite scroll — only fires when a previous load already succeeded
  useEffect(() => {
  const sentinel = sentinelRef.current
  if (!sentinel) return

  const observer = new IntersectionObserver((entries) => {
    if (
      entries[0].isIntersecting &&
      hasMore &&
      status === 'succeeded'   // solo dispara si el fetch anterior ya terminó
    ) {
      dispatch(fetchPins(page))
    }
  })

  observer.observe(sentinel)
  return () => observer.disconnect()
}, [dispatch, hasMore, page, status])

  const skeletonCount = items.length === 0 ? SKELETON_HEIGHTS.length : 8

  return (
    <div style={styles.container}>
      <div style={{ ...styles.grid, columnCount }}>
        {items.map((pin: any) => (
          <PinCard key={pin.id} pin={pin} />
        ))}

        {status === 'loading' &&
          SKELETON_HEIGHTS.slice(0, skeletonCount).map((height, i) => (
            <div key={`skel-${i}`} style={{ ...styles.skeleton, height }} />
          ))}
      </div>

      {status === 'failed' && error !== null && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryBtn} onClick={() => dispatch(fetchPins(page))}>
            Reintentar
          </button>
        </div>
      )}

      {!hasMore && status === 'succeeded' && (
        <p style={styles.endMsg}>No hay más pins</p>
      )}

      {/* Sentinel element watched by IntersectionObserver */}
      <div ref={sentinelRef} style={styles.sentinel} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#f0f0f0',
    minHeight: '100vh',
  },
  grid: {
    columnGap: '16px',
  },
  skeleton: {
    borderRadius: '16px',
    backgroundColor: '#e0e0e0',
    marginBottom: '16px',
    breakInside: 'avoid',
  },
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px',
    gap: '12px',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: '16px',
    margin: 0,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#E60023',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '10px 24px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  endMsg: {
    textAlign: 'center',
    color: '#767676',
    fontSize: '14px',
    padding: '24px 0',
    margin: 0,
  },
  sentinel: {
    height: '1px',
  },
}

export default PinFeed
