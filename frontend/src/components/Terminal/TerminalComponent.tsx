import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import terminalService from '../../services/terminalService';
import 'xterm/css/xterm.css';
import './TerminalComponent.css';

interface TerminalComponentProps {
  sessionId?: string;
  onReady?: () => void;
}

const TerminalComponent: React.FC<TerminalComponentProps> = ({ sessionId, onReady }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current || !sessionId) return;

    const terminal = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;

    terminalService.connect(sessionId).then(() => {
      terminalService.onData((data) => {
        terminal.write(data);
      });

      terminal.onData((data) => {
        terminalService.sendInput(data);
      });

      terminal.onResize(({ cols, rows }) => {
        terminalService.resize(cols, rows);
      });

      if (onReady) {
        onReady();
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      terminalService.disconnect();
    };
  }, [sessionId, onReady]);

  return <div ref={terminalRef} className="terminal-container" />;
};

export default TerminalComponent;