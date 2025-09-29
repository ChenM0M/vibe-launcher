import React, { useEffect, useRef, useState } from 'react';
import { Button, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import terminalService from '../../services/terminalService';
import './AlternativeTerminal.css';

interface AlternativeTerminalProps {
  sessionId: string;
  projectPath: string;
  command: string;
  onReady?: () => void;
}

const AlternativeTerminal: React.FC<AlternativeTerminalProps> = ({
  sessionId,
  projectPath,
  command,
  onReady
}) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket for terminal updates
    terminalService.connect(sessionId).then(() => {
      setIsConnected(true);
      if (onReady) {
        onReady();
      }
    }).catch(err => {
      message.error('Failed to connect to terminal');
      console.error(err);
    });

    return () => {
      terminalService.disconnect();
    };
  }, [sessionId, onReady]);

  const handleLaunch = () => {
    // Create a temporary batch file content
    const batchContent = command;

    // Create a data URL for the batch file
    const blob = new Blob([batchContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'launch_vibecoding.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    message.info('Batch file downloaded. Please run it to start VibeCoding in a new terminal.');
  };

  return (
    <div className="alternative-terminal">
      <div className="terminal-info">
        <h3>VibeCoding Project Launcher</h3>
        <p>Due to browser security restrictions, we cannot directly launch terminals.</p>
        <p>Click the button below to download a launcher script for your project.</p>

        <div className="project-details">
          <strong>Project Path:</strong> {projectPath}
        </div>

        <div className="launch-instructions">
          <h4>Instructions:</h4>
          <ol>
            <li>Click the "Download Launcher" button</li>
            <li>Save the .bat file to your desired location</li>
            <li>Double-click the downloaded .bat file to start VibeCoding</li>
            <li>The terminal will open with your project configured</li>
          </ol>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handleLaunch}
          className="launch-button"
        >
          Download Launcher
        </Button>

        <div className="command-preview">
          <h4>Command Preview:</h4>
          <pre>{command}</pre>
        </div>
      </div>
    </div>
  );
};

export default AlternativeTerminal;