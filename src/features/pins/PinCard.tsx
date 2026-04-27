import type { Pin } from '../../types'

interface PinCardProps {
  pin: Pin
}

function PinCard({ pin }: PinCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.imageWrapper}>
        <img
          src={pin.imageUrl}
          alt={pin.title}
          loading="lazy"
          style={styles.image}
        />
        <div style={styles.overlay}>
          <button style={styles.saveButton}>Guardar</button>
        </div>
      </div>

      <div style={styles.info}>
        <p style={styles.title}>{pin.title}</p>
        <p style={styles.author}>{pin.author}</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    breakInside: 'avoid',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    display: 'block',
    borderRadius: '16px',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '16px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: '12px',
  },
  saveButton: {
    backgroundColor: '#E60023',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '8px 16px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  info: {
    padding: '8px 4px 12px',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px',
    color: '#111',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  author: {
    fontSize: '12px',
    color: '#767676',
    margin: 0,
  },
}

export default PinCard