import React, { useState } from 'react'
import { motion } from 'framer-motion'
import './MindViewer.css'
import { PortableText } from '@portabletext/react'
import { urlFor } from '../lib/sanity'
import { FiFileText, FiCopy, FiCheck, FiPlay } from 'react-icons/fi'
import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'

let pyodideInstance = null;

const loadPyodide = async () => {
  if (pyodideInstance) return pyodideInstance;
  if (!window.loadPyodide) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  pyodideInstance = await window.loadPyodide({
    stdin: window.prompt,
  });
  return pyodideInstance;
};

const CodeBlock = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const [codeContent, setCodeContent] = useState(value?.code || '');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(false);

  if (!value || !value.code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizeLanguage = (lang) => {
    if (!lang) return 'javascript';
    const l = lang.toLowerCase().trim();
    if (['javascript', 'js', 'jsx', 'tsx', 'typescript', 'ts', 'node'].includes(l)) return 'javascript';
    if (['python', 'py', 'python3'].includes(l)) return 'python';
    if (['bash', 'sh', 'shell', 'zsh', 'batch', 'batchfile', 'bat', 'cmd', 'powershell', 'ps1', 'terminal'].includes(l)) return 'shell';
    return l;
  };

  const getLanguageExtension = (lang) => {
    const normalized = normalizeLanguage(lang);
    if (normalized === 'python') return [python()];
    return [javascript({ jsx: true })];
  };

  const executeWithInputs = async (queue) => {
    setIsRunning(true);
    setOutput('Running...');
    setError(false);

    let currentQueue = [...queue];
    window.get_stdin_value = (promptText) => {
      if (currentQueue.length > 0) return currentQueue.shift();
      return window.prompt(promptText || "Enter input:") || "";
    };

    try {
      const lang = normalizeLanguage(value.language);

      if (lang === 'javascript') {
        const result = await new Promise((resolve) => {
          const iframe = document.createElement('iframe');
          iframe.sandbox = 'allow-scripts';
          iframe.style.display = 'none';

          const timeout = setTimeout(() => {
            resolve({ output: '⚠ Execution timed out (10s limit).', isError: true });
            iframe.remove();
          }, 10000);

          const handler = (event) => {
            if (event.source !== iframe.contentWindow) return;
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data);
            iframe.remove();
          };
          window.addEventListener('message', handler);

          const html = `<!DOCTYPE html><html><head><script>
            const logs = [];
            const stringify = (a) => typeof a === 'object' ? JSON.stringify(a) : String(a);
            console.log = (...args) => logs.push(args.map(stringify).join(' '));
            console.error = (...args) => logs.push(args.map(stringify).join(' '));
            console.warn = (...args) => logs.push(args.map(stringify).join(' '));
            
            const inputs = ${JSON.stringify(queue)};
            let inputIdx = 0;
            window.prompt = (msg) => {
              const val = inputs[inputIdx++] || '';
              logs.push((msg || '') + val);
              return val;
            };

            (async () => {
              try {
                const AsyncFn = Object.getPrototypeOf(async function(){}).constructor;
                await new AsyncFn(${JSON.stringify(codeContent)})();
                parent.postMessage({ output: logs.join('\\n') || 'Program exited successfully with no output.', isError: false }, '*');
              } catch(e) {
                parent.postMessage({ output: logs.join('\\n') + (logs.length ? '\\n' : '') + e.toString(), isError: true }, '*');
              }
            })();
          <\/script></head><body></body></html>`;

          iframe.srcdoc = html;
          document.body.appendChild(iframe);
        });

        setOutput(result.output);
        if (result.isError) setError(true);
      } else if (lang === 'python') {
        try {
          const pyodide = await loadPyodide();
          
          let outputBuffer = [];
          pyodide.setStdout({ batched: (msg) => outputBuffer.push(msg) });
          pyodide.setStderr({ batched: (msg) => outputBuffer.push(msg) });

          let code = codeContent;
          const pipLines = code.split('\n').filter(line => /^\s*!?\s*pip\s+install\s+/i.test(line.trim()));
          if (pipLines.length > 0) {
            await pyodide.loadPackage('micropip');
            const micropip = pyodide.pyimport('micropip');
            for (const pipLine of pipLines) {
              const pkgs = pipLine.replace(/^\s*!?\s*pip\s+install\s+/i, '').trim().split(/\s+/);
              for (const pkg of pkgs) {
                if (pkg && !pkg.startsWith('-')) {
                  try {
                    outputBuffer.push(`Installing ${pkg}...`);
                    await micropip.install(pkg);
                    outputBuffer.push(`✓ ${pkg} installed successfully`);
                  } catch (installErr) {
                    outputBuffer.push(`⚠ Could not install ${pkg}: ${installErr.message || installErr}`);
                  }
                }
              }
            }
            code = code.split('\n').filter(line => !/^\s*!?\s*pip\s+install\s+/i.test(line.trim())).join('\n');
          }

          if (code.trim()) {
            await pyodide.runPythonAsync(`
import builtins
import js
def custom_input(prompt_text=""):
    if prompt_text:
        print(str(prompt_text), end="")
    res = js.get_stdin_value(str(prompt_text))
    print(res)
    return res
builtins.input = custom_input
`);
            await pyodide.runPythonAsync(code);
          }
          setOutput(outputBuffer.join('\n') || 'Program exited successfully with no output.');
        } catch (e) {
          setError(true);
          setOutput(e.toString());
        }
      } else if (lang === 'shell') {
        const trimmed = codeContent.trim();
        if (/^\s*pip\s+install\s+/im.test(trimmed)) {
          try {
            const pyodide = await loadPyodide();
            await pyodide.loadPackage('micropip');
            const micropip = pyodide.pyimport('micropip');
            
            let outputBuffer = [];
            const lines = trimmed.split('\n').filter(l => l.trim());
            for (const line of lines) {
              const match = line.trim().match(/^pip\s+install\s+(.+)/i);
              if (match) {
                const pkgs = match[1].trim().split(/\s+/);
                for (const pkg of pkgs) {
                  if (pkg && !pkg.startsWith('-')) {
                    try {
                      outputBuffer.push(`Installing ${pkg}...`);
                      await micropip.install(pkg);
                      outputBuffer.push(`✓ ${pkg} installed successfully`);
                    } catch (installErr) {
                      outputBuffer.push(`⚠ Could not install ${pkg}: ${installErr.message || installErr}`);
                    }
                  }
                }
              } else {
                outputBuffer.push(`⚠ Shell command not supported in browser: ${line.trim()}`);
              }
            }
            setOutput(outputBuffer.join('\n'));
          } catch (e) {
            setError(true);
            setOutput(e.toString());
          }
        } else {
          setOutput(
            `⚠ Shell/terminal commands cannot run directly in the browser.\n\nTo run this, open a terminal on your machine and paste:\n\n  ${trimmed.split('\n')[0]}\n\nTip: Use the "Copy" button to copy the command.`
          );
          setError(true);
        }
      } else {
        setOutput(`⚠ "${value.language}" is not yet supported by the inline compiler.\nSupported languages: JavaScript, TypeScript, Python\nShell commands (pip install) are handled via Pyodide.`);
        setError(true);
      }
    } catch (err) {
      setError(true);
      setOutput(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunCode = async () => {
    await executeWithInputs([]);
  };

  const btnStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    padding: '0.3rem 0.6rem',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: 'monospace'
  };

  return (
    <div style={{ margin: '2rem 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#1e1e1e', borderBottom: '1px solid #333' }}>
        <div style={{ color: '#888', fontSize: '0.85rem', fontFamily: 'monospace' }}>
          {value.filename || normalizeLanguage(value.language)}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleRunCode} disabled={isRunning} style={{ ...btnStyle, opacity: isRunning ? 0.5 : 1 }}>
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button onClick={handleCopy} style={btnStyle}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div style={{ background: '#1e1e1e' }}>
        <CodeMirror
          value={codeContent}
          theme={vscodeDark}
          extensions={getLanguageExtension(value.language)}
          onChange={(val) => setCodeContent(val)}
          style={{ fontSize: '0.9rem', fontFamily: '"JetBrains Mono", monospace' }}
        />
      </div>

      {/* Output Area (Only visible if output is not null) */}
      {output !== null && (
        <div style={{ padding: '1rem', background: '#0a0a0a', borderTop: '1px solid #333', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ color: '#888' }}>Terminal Output</div>
            <button onClick={() => setOutput(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.75rem' }}>Clear</button>
          </div>
          <pre style={{ color: error ? '#ef4444' : '#10b981', margin: 0, whiteSpace: 'pre-wrap' }}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

// Custom portable text components to match NextWork aesthetic
const components = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) return null
      return (
        <div className="article-image-container">
          <img
            alt={value.alt || 'Article Image'}
            loading="lazy"
            src={urlFor(value).auto('format').fit('max').width(800).url()}
            className="article-image"
          />
        </div>
      )
    },
    code: CodeBlock,
    callout: ({ value }) => {
      const config = {
        info: { bg: 'rgba(56, 189, 248, 0.1)', border: '#38bdf8', icon: '💡' },
        warning: { bg: 'rgba(250, 204, 21, 0.1)', border: '#facc15', icon: '⚠️' },
        success: { bg: 'rgba(74, 222, 128, 0.1)', border: '#4ade80', icon: '✅' },
      }
      const style = config[value.intent || 'info']
      return (
        <div style={{ padding: '1rem 1.5rem', margin: '2rem 0', background: style.bg, borderLeft: `4px solid ${style.border}`, borderRadius: '0 8px 8px 0', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{style.icon}</span>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>{value.text}</p>
        </div>
      )
    },
  },
  block: {
    h1: ({ children, value }) => <h1 id={`heading-${value._key}`} className="article-h1">{children}</h1>,
    h2: ({ children, value }) => <h2 id={`heading-${value._key}`} className="article-h2">{children}</h2>,
    h3: ({ children, value }) => <h3 id={`heading-${value._key}`} className="article-h3">{children}</h3>,
    normal: ({ children }) => <p className="article-p">{children}</p>,
    blockquote: ({ children }) => <blockquote className="article-quote">{children}</blockquote>,
  },
  marks: {
    em: ({ children }) => <em className="article-em">{children}</em>,
    strong: ({ children }) => <strong className="article-strong">{children}</strong>,
    underline: ({ children }) => <u style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}>{children}</u>,
    'strike-through': ({ children }) => <del style={{ textDecoration: 'line-through', opacity: 0.6 }}>{children}</del>,
    code: ({ children }) => <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9em', color: '#38bdf8' }}>{children}</code>,
    link: ({ value, children }) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined
      return (
        <a href={value?.href} target={target} rel={target === '_blank' ? 'noindex nofollow' : ''} className="article-link">
          {children}
        </a>
      )
    },
  },
}

export default function MindViewer({ mind, fullWidth = false }) {
  if (!mind) {
    return (
      <div className="mind-viewer empty-state">
        <div className="empty-icon"><FiFileText size={48} color="var(--border)" /></div>
        <h3>No Mind Selected</h3>
        <p>Select a mind from the sidebar to start reading.</p>
      </div>
    )
  }

  const { title, publishedAt, mainImage, body, notebookUrl, authorName } = mind
  const date = publishedAt ? new Date(publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Draft'

  const getNotebookBadge = (url) => {
    if (!url) return null;
    if (url.includes('colab.research.google.com')) {
      return { type: 'image', src: 'https://colab.research.google.com/assets/colab-badge.svg', alt: 'Open in Colab' };
    }
    if (url.includes('kaggle.com')) {
      return { type: 'image', src: 'https://kaggle.com/static/images/open-in-kaggle.svg', alt: 'Open in Kaggle' };
    }
    return { type: 'fallback' };
  };

  const badgeConfig = getNotebookBadge(notebookUrl);

  return (
    <motion.div
      key={mind.slug?.current || title}
      className={`mind-viewer prose ${fullWidth ? 'full-width' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="article-content-wrapper">
        {/* Main Image */}
        {mainImage && (
          <div className="article-main-image" style={{ marginBottom: '2rem' }}>
            <img 
              src={urlFor(mainImage).auto('format').fit('max').width(1200).url()} 
              alt={title || 'Mind Cover'} 
              style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', maxHeight: '500px' }}
            />
          </div>
        )}

        {/* Title */}
        <h1 className="article-title">{title}</h1>

        {/* Substack-style author block with Colab badge */}
        <div className="article-author-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="article-author-avatar">
              {(authorName || 'B')[0].toUpperCase()}
            </div>
            <div className="article-author-info">
              <span className="article-author-name">{authorName || 'Binary Minds'}</span>
              <span className="article-author-date">{date}</span>
            </div>
          </div>

          {/* Notebook badge if exists */}
          {notebookUrl && badgeConfig && (
            <div>
              <a 
                href={notebookUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={badgeConfig.type === 'image' ? {
                  display: 'inline-block',
                  transition: 'transform 0.2s ease',
                } : {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '8px',
                  color: '#38bdf8',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => badgeConfig.type === 'image' ? e.currentTarget.style.transform = 'scale(1.05)' : e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                onMouseOut={(e) => badgeConfig.type === 'image' ? e.currentTarget.style.transform = 'scale(1)' : e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
              >
                {badgeConfig.type === 'image' ? (
                  <img 
                    src={badgeConfig.src} 
                    alt={badgeConfig.alt} 
                    style={{ height: '32px', display: 'block' }}
                  />
                ) : (
                  <>
                    Open Notebook
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </>
                )}
              </a>
            </div>
          )}
        </div>

        {/* Separator line before body */}
        <hr className="article-separator" />

        {/* Article body */}
        <div className="article-body">
          {body ? (
            <PortableText value={body} components={components} />
          ) : (
            <p className="article-p">This mind is empty. Ask the author to add some content!</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
