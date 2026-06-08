import { useState, useRef, useCallback, useEffect } from 'react'
import type { UpdateInfo } from './types/electron'
import './App.css'

interface Point {
  x: number
  y: number
}

// Update status states
type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPointerActive, setIsPointerActive] = useState(false)
  const [color, setColor] = useState('#ff3333')
  const [lineWidth, setLineWidth] = useState(4)
  const [showControls, setShowControls] = useState(false)
  const lastPoint = useRef<Point | null>(null)

  // Update state
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Listen for toggle-pointer from main process
  useEffect(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.on('main-process-message', (_event, message) => {
        console.log(message)
      })
    }
    if (window.electronAPI) {
      window.electronAPI.onTogglePointer((active: boolean) => {
        setIsPointerActive(active)
        setShowControls(active)
        if (!active) {
          setIsDrawing(false)
        }
      })
    }
  }, [])

  // Listen for auto-update events from main process
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    api.onUpdateChecking(() => {
      setUpdateStatus('checking')
      setUpdateError(null)
    })

    api.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateStatus('available')
      setUpdateInfo(info)
    })

    api.onUpdateNotAvailable(() => {
      // Keep quiet — no update is the expected normal state
      setUpdateStatus('not-available')
      // Reset to idle after a short delay
      setTimeout(() => setUpdateStatus('idle'), 2000)
    })

    api.onUpdateProgress((progress) => {
      setUpdateStatus('downloading')
      setDownloadProgress(progress.percent)
    })

    api.onUpdateDownloaded((info) => {
      setUpdateStatus('downloaded')
      setUpdateInfo(info)
      setDownloadProgress(100)
    })

    api.onUpdateError((error) => {
      setUpdateStatus('error')
      setUpdateError(error.message)
    })

    return () => {
      api.removeUpdateListeners()
    }
  }, [])

  // Resize canvas when window resizes
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX, y: touch.clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }, [])

  const drawLine = useCallback((start: Point, end: Point) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [color, lineWidth])

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isPointerActive) return
    setIsDrawing(true)
    const point = getCanvasPoint(e)
    lastPoint.current = point
    // Draw a dot at the starting point
    drawLine(point, point)
  }, [isPointerActive, getCanvasPoint, drawLine])

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint.current) return
    const currentPoint = getCanvasPoint(e)
    drawLine(lastPoint.current, currentPoint)
    lastPoint.current = currentPoint
  }, [isDrawing, getCanvasPoint, drawLine])

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false)
    lastPoint.current = null
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const togglePointer = useCallback(() => {
    const newState = !isPointerActive
    setIsPointerActive(newState)
    setShowControls(newState)
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(!newState)
    }
    if (!newState) {
      setIsDrawing(false)
    }
  }, [isPointerActive])

  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev)
  }, [])

  // Update actions
  const handleDownloadUpdate = useCallback(() => {
    window.electronAPI?.downloadUpdate()
  }, [])

  const handleInstallUpdate = useCallback(() => {
    window.electronAPI?.quitAndInstall()
  }, [])

  const handleDismissUpdate = useCallback(() => {
    setUpdateStatus('idle')
    setUpdateInfo(null)
    setUpdateError(null)
  }, [])

  const handleCheckUpdates = useCallback(() => {
    setUpdateError(null)
    window.electronAPI?.checkForUpdates().catch((err: Error) => {
      setUpdateStatus('error')
      setUpdateError(err.message)
    })
  }, [])

  const colors = ['#ff3333', '#33ff33', '#3355ff', '#ffff33', '#ff33ff', '#33ffff', '#ffffff', '#ff8800']

  return (
    <div className="pointer-overlay">
      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        className={`drawing-canvas ${isPointerActive ? 'active' : ''}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {/* Hint text when pointer is inactive */}
      {!isPointerActive && (
        <div className="hint-overlay">
          <div className="hint-text">
            <kbd>Ctrl+Shift+P</kbd> to activate pointer
          </div>
          <div className="hint-subtext">
            Press <kbd>Esc</kbd> to deactivate
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={`toolbar ${showControls ? 'visible' : ''}`}>
        <button
          className={`tool-btn toggle-btn ${isPointerActive ? 'active' : ''}`}
          onClick={togglePointer}
          title="Toggle Pointer (Ctrl+Shift+P)"
        >
          {isPointerActive ? '✏️ Drawing' : '🖊️ Draw'}
        </button>

        {isPointerActive && (
          <>
            <div className="color-picker">
              {colors.map(c => (
                <button
                  key={c}
                  className={`color-swatch ${c === color ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="color-input"
                title="Custom color"
              />
            </div>
            <div className="line-width-picker">
              {[2, 4, 6, 8, 12].map(w => (
                <button
                  key={w}
                  className={`width-btn ${w === lineWidth ? 'selected' : ''}`}
                  onClick={() => setLineWidth(w)}
                  title={`${w}px width`}
                >
                  <span className="width-dot" style={{ width: w, height: w }} />
                </button>
              ))}
            </div>
            <button className="tool-btn clear-btn" onClick={clearCanvas} title="Clear canvas">
              🗑️ Clear
            </button>
          </>
        )}

        <button className="tool-btn toggle-controls-btn" onClick={toggleControls} title="Toggle toolbar">
          {showControls ? '🙈 Hide' : '🙉 Show'}
        </button>
      </div>

      {/* Collapsed control toggle when toolbar is hidden */}
      {!showControls && isPointerActive && (
        <button className="mini-toggle" onClick={toggleControls} title="Show toolbar">
          🎨
        </button>
      )}

      {/* Update Notification */}
      {updateStatus !== 'idle' && (
        <div className={`update-notification update-${updateStatus}`}>
          {updateStatus === 'checking' && (
            <span>🔍 Checking for updates…</span>
          )}

          {updateStatus === 'available' && updateInfo && (
            <div className="update-available-content">
              <span className="update-icon">📦</span>
              <div className="update-details">
                <span className="update-title">
                  Version {updateInfo.version} is available
                </span>
                {updateInfo.releaseNotes && (
                  <span className="update-notes">
                    {typeof updateInfo.releaseNotes === 'string'
                      ? updateInfo.releaseNotes.slice(0, 120)
                      : ''}
                  </span>
                )}
              </div>
              <div className="update-actions">
                <button className="update-btn update-download-btn" onClick={handleDownloadUpdate}>
                  ⬇ Download
                </button>
                <button className="update-btn update-dismiss-btn" onClick={handleDismissUpdate}>
                  ✕
                </button>
              </div>
            </div>
          )}

          {updateStatus === 'downloading' && (
            <div className="update-downloading-content">
              <span>⬇ Downloading update…</span>
              <div className="update-progress-bar">
                <div
                  className="update-progress-fill"
                  style={{ width: `${Math.round(downloadProgress)}%` }}
                />
              </div>
              <span className="update-progress-text">{Math.round(downloadProgress)}%</span>
            </div>
          )}

          {updateStatus === 'downloaded' && updateInfo && (
            <div className="update-downloaded-content">
              <span className="update-icon">✅</span>
              <div className="update-details">
                <span className="update-title">Version {updateInfo.version} ready to install</span>
                <span className="update-subtitle">Restart the app to apply the update</span>
              </div>
              <div className="update-actions">
                <button className="update-btn update-install-btn" onClick={handleInstallUpdate}>
                  🔄 Restart Now
                </button>
                <button className="update-btn update-dismiss-btn" onClick={handleDismissUpdate}>
                  Later
                </button>
              </div>
            </div>
          )}

          {updateStatus === 'error' && (
            <div className="update-error-content">
              <span>⚠️ Update error: {updateError || 'Unknown error'}</span>
              <div className="update-actions">
                <button className="update-btn update-retry-btn" onClick={handleCheckUpdates}>
                  🔄 Retry
                </button>
                <button className="update-btn update-dismiss-btn" onClick={handleDismissUpdate}>
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
