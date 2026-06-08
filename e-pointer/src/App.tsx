import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'

interface Point {
  x: number
  y: number
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPointerActive, setIsPointerActive] = useState(false)
  const [color, setColor] = useState('#ff3333')
  const [lineWidth, setLineWidth] = useState(4)
  const [showControls, setShowControls] = useState(false)
  const lastPoint = useRef<Point | null>(null)

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
    </div>
  )
}

export default App
