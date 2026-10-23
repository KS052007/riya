import { useState, useEffect, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { RiPlayFill, RiLoader4Line } from 'react-icons/ri'

export default function CodePlayground({ initialCode, language = 'javascript' }) {
  const [code, setCode] = useState(initialCode || '')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(false)
  const [pyodideLoaded, setPyodideLoaded] = useState(false)
  const pyodideRef = useRef(null)

  const isPython = language.toLowerCase() === 'python'

  useEffect(() => {
    if (isPython && !window.loadPyodide && !document.getElementById('pyodide-script')) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js'
      script.id = 'pyodide-script'
      script.async = true
      script.onload = async () => {
        try {
          pyodideRef.current = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
          })
          setPyodideLoaded(true)
        } catch (err) {
          console.error("Failed to load Pyodide:", err)
        }
      }
      document.body.appendChild(script)
    } else if (isPython && window.loadPyodide && !pyodideRef.current) {
      window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
      }).then(p => {
        pyodideRef.current = p
        setPyodideLoaded(true)
      })
    }
  }, [isPython])

  const runJS = (queue) => {
    return new Promise((resolve) => {
      let logs = []
      const originalLog = console.log
      const originalError = console.error
      const originalPrompt = window.prompt
      
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        originalLog(...args)
      }
      console.error = (...args) => {
        logs.push('[Error] ' + args.map(a => String(a)).join(' '))
        originalError(...args)
      }

      let inputIdx = 0
      window.prompt = (msg) => {
        const val = queue[inputIdx++] || ''
        logs.push((msg || '') + val)
        return val
      }

      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(code)
        fn()
        resolve({ logs: logs.join('\n') || 'Execution complete (no output).', isError: false })
      } catch (err) {
        resolve({ logs: logs.join('\n') + '\n[Error]: ' + err.message, isError: true })
      } finally {
        console.log = originalLog
        console.error = originalError
        window.prompt = originalPrompt
      }
    })
  }

  const runPython = async (queue) => {
    if (!pyodideRef.current) return { logs: 'Pyodide is still loading... please wait a moment.', isError: true }
    try {
      const pyodide = pyodideRef.current
      
      let currentQueue = [...queue]
      window.get_stdin_value = (promptText) => {
        if (currentQueue.length > 0) {
          return currentQueue.shift()
        }
        return window.prompt(promptText || "Enter input:") || ""
      }

      await pyodide.runPythonAsync(`
import sys
import io
import builtins
import js

sys.stdout = io.StringIO()

def custom_input(prompt_text=""):
    if prompt_text:
        print(str(prompt_text), end="")
    res = js.get_stdin_value(str(prompt_text))
    print(res)
    return res
builtins.input = custom_input
      `)
      await pyodide.runPythonAsync(code)
      const out = await pyodide.runPythonAsync("sys.stdout.getvalue()")
      return { logs: out || 'Execution complete (no output).', isError: false }
    } catch (err) {
      return { logs: err.message, isError: true }
    }
  }

  const executeWithInputs = async (queue) => {
    setIsRunning(true)
    setOutput('Running...')
    setError(false)
    
    await new Promise(r => setTimeout(r, 50))
    
    let res = null
    if (isPython) {
      res = await runPython(queue)
    } else {
      res = await runJS(queue)
    }
    
    setOutput(res.logs)
    setError(res.isError)
    setIsRunning(false)
  }

  const handleRun = async () => {
    await executeWithInputs([])
  }

  const extensions = isPython ? [python()] : [javascript({ jsx: true })]

  return (
    <div className="blitz-editor-wrap">
      {/* Header */}
      <div className="blitz-editor-header">
        <div className="blitz-editor-tabs">
          <div className="blitz-editor-tab active">
            <span style={{ color: isPython ? '#f59e0b' : '#facc15', marginRight: '0.5rem' }}>{isPython ? 'Py' : 'JS'}</span>
            {isPython ? 'main.py' : 'index.js'}
          </div>
        </div>
        <div className="blitz-editor-actions">
          <button 
            className="blitz-run-btn"
            onClick={handleRun}
            disabled={isRunning || (isPython && !pyodideLoaded)}
          >
            {isRunning ? <RiLoader4Line className="spin" size={16} /> : <RiPlayFill size={16} />}
            {isPython && !pyodideLoaded ? 'Loading Env...' : 'Run Code'}
          </button>
        </div>
      </div>
      
      <div className="blitz-editor-body">
        <CodeMirror
          value={code}
          height="300px"
          theme={vscodeDark}
          extensions={extensions}
          onChange={(val) => setCode(val)}
          style={{ fontSize: '14px', fontFamily: '"JetBrains Mono", monospace' }}
        />
      </div>

      {/* Console Output Panel - Always visible */}
      <div className="blitz-editor-terminal">
        <div className="blitz-term-header">
          <div className="blitz-term-title">Terminal Output</div>
          <button onClick={() => setOutput('')} className="blitz-term-clear">Clear</button>
        </div>
        <pre className={`blitz-term-output ${error ? 'error' : 'success'}`}>
          {output || 'Ready for execution...'}
        </pre>
      </div>
    </div>
  )
}
