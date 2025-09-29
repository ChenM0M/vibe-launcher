const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createServer } = require('http');
const { Server } = require('socket.io');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = createServer(app);

// 从环境变量获取CORS配置
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors({
  origin: corsOrigin
}));
app.use(express.json());

// 从环境变量获取数据库路径
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// 初始化数据库
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS project_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    path TEXT NOT NULL,
    group_id TEXT,
    default_cli_tag TEXT,
    default_env_tag TEXT,
    default_ide_tag TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES project_groups(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cli_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS env_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS env_configurations (
    id TEXT PRIMARY KEY,
    tag_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    description TEXT,
    FOREIGN KEY(tag_id) REFERENCES env_tags(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ide_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    executable_path TEXT NOT NULL,
    command_args TEXT,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 插入默认CLI标签
  db.get("SELECT COUNT(*) as count FROM cli_tags", (err, row) => {
    if (row && row.count === 0) {
      const defaultCLIs = [
        { id: uuidv4(), name: 'Claude Code', command: 'claude', description: 'Official Claude CLI', color: '#667eea' },
        { id: uuidv4(), name: 'Windsurf', command: 'windsurf', description: 'Windsurf CLI', color: '#00b4d8' },
        { id: uuidv4(), name: 'Cursor', command: 'cursor', description: 'Cursor IDE', color: '#1e90ff' },
        { id: uuidv4(), name: 'VS Code', command: 'code', description: 'Visual Studio Code', color: '#007acc' }
      ];

      const stmt = db.prepare("INSERT INTO cli_tags (id, name, command, description, color) VALUES (?, ?, ?, ?, ?)");
      defaultCLIs.forEach(cli => {
        stmt.run([cli.id, cli.name, cli.command, cli.description, cli.color]);
      });
      stmt.finalize();
    }
  });

  // 插入默认IDE标签
  db.get("SELECT COUNT(*) as count FROM ide_tags", (err, row) => {
    if (row && row.count === 0) {
      const defaultIDEs = [
        {
          id: uuidv4(),
          name: 'VS Code',
          executable_path: 'code',
          command_args: '.',
          description: 'Visual Studio Code',
          color: '#007acc'
        },
        {
          id: uuidv4(),
          name: 'Cursor',
          executable_path: 'cursor',
          command_args: '.',
          description: 'Cursor IDE',
          color: '#1e90ff'
        },
        {
          id: uuidv4(),
          name: 'Windsurf',
          executable_path: 'windsurf',
          command_args: '.',
          description: 'Windsurf IDE',
          color: '#00b4d8'
        },
        {
          id: uuidv4(),
          name: 'WebStorm',
          executable_path: 'webstorm',
          command_args: '.',
          description: 'JetBrains WebStorm',
          color: '#0fa7bf'
        }
      ];

      const ideStmt = db.prepare("INSERT INTO ide_tags (id, name, executable_path, command_args, description, color) VALUES (?, ?, ?, ?, ?, ?)");
      defaultIDEs.forEach(ide => {
        ideStmt.run([ide.id, ide.name, ide.executable_path, ide.command_args, ide.description, ide.color]);
      });
      ideStmt.finalize();
    }
  });

  // 插入默认环境标签
  db.get("SELECT COUNT(*) as count FROM env_tags", (err, row) => {
    if (row && row.count === 0) {
      const defaultEnvTag = {
        id: uuidv4(),
        name: 'Default Claude',
        description: 'Default Claude environment',
        color: '#764ba2'
      };

      db.run("INSERT INTO env_tags (id, name, description, color) VALUES (?, ?, ?, ?)",
        [defaultEnvTag.id, defaultEnvTag.name, defaultEnvTag.description, defaultEnvTag.color],
        function() {
          // 添加默认环境变量（从环境变量获取默认值）
          const defaultVars = [
            { key: 'ANTHROPIC_BASE_URL', value: process.env.DEFAULT_ANTHROPIC_BASE_URL || 'https://api.anthropic.com' },
            { key: 'ANTHROPIC_AUTH_TOKEN', value: process.env.DEFAULT_ANTHROPIC_AUTH_TOKEN || '' },
            { key: 'CLAUDE_CODE_GIT_BASH_PATH', value: process.env.DEFAULT_CLAUDE_CODE_GIT_BASH_PATH || 'C:\\Program Files\\Git\\bin\\bash.exe' }
          ];

          const envStmt = db.prepare("INSERT INTO env_configurations (id, tag_id, key, value) VALUES (?, ?, ?, ?)");
          defaultVars.forEach(v => {
            envStmt.run([uuidv4(), defaultEnvTag.id, v.key, v.value]);
          });
          envStmt.finalize();
        }
      );
    }
  });
});

const activeSessions = new Map();

const handleError = (err, req, res, next) => {
  console.error('Server error:', err);

  // 避免泄露敏感信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? err.message : 'Internal server error';

  res.status(500).json({
    error: errorMessage,
    timestamp: new Date().toISOString()
  });
};

const handleDbError = (err, res, operation = '操作') => {
  console.error(`Database error during ${operation}:`, err);

  // 根据错误类型返回不同的用户友好消息
  let userMessage = '操作失败，请重试';
  if (err.code === 'SQLITE_CONSTRAINT') {
    userMessage = '数据约束错误，请检查输入';
  } else if (err.code === 'SQLITE_BUSY') {
    userMessage = '系统繁忙，请稍后重试';
  }

  res.status(500).json({
    error: userMessage,
    timestamp: new Date().toISOString()
  });
};

// ==================== 项目分组 API ====================
app.get('/api/groups', (req, res) => {
  db.all("SELECT * FROM project_groups ORDER BY created_at DESC", (err, rows) => {
    if (err) return handleDbError(err, res, '获取分组列表');
    res.json(rows);
  });
});

app.post('/api/groups', (req, res) => {
  const { name, description, icon, color } = req.body;

  // 输入验证
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: '分组名称不能为空' });
  }

  const id = uuidv4();

  db.run(
    "INSERT INTO project_groups (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)",
    [id, name.trim(), description, icon, color],
    function(err) {
      if (err) return handleDbError(err, res, '创建分组');
      res.json({ id, name: name.trim(), description, icon, color });
    }
  );
});

app.delete('/api/groups/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: '分组ID不能为空' });
  }

  db.run("DELETE FROM project_groups WHERE id = ?", [id], function(err) {
    if (err) return handleDbError(err, res, '删除分组');

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: "分组删除成功" });
  });
});

// ==================== CLI标签 API ====================
app.get('/api/cli-tags', (req, res) => {
  db.all("SELECT * FROM cli_tags ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/cli-tags', (req, res) => {
  const { name, command, description, icon, color } = req.body;
  const id = uuidv4();

  db.run(
    "INSERT INTO cli_tags (id, name, command, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)",
    [id, name, command, description, icon, color],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, command, description, icon, color });
    }
  );
});

app.put('/api/cli-tags/:id', (req, res) => {
  const { name, command, description, icon, color } = req.body;

  db.run(
    "UPDATE cli_tags SET name = ?, command = ?, description = ?, icon = ?, color = ? WHERE id = ?",
    [name, command, description, icon, color, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "CLI tag updated" });
    }
  );
});

app.delete('/api/cli-tags/:id', (req, res) => {
  db.run("DELETE FROM cli_tags WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "CLI tag deleted" });
  });
});

// ==================== 环境标签 API ====================
app.get('/api/env-tags', (req, res) => {
  db.all("SELECT * FROM env_tags ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // 获取每个标签的配置数
    if (rows.length === 0) {
      return res.json([]);
    }

    let completed = 0;
    const tagsWithCounts = rows.map(tag => ({ ...tag, configurations: [] }));

    rows.forEach((tag, index) => {
      db.all("SELECT * FROM env_configurations WHERE tag_id = ?", [tag.id], (err, configs) => {
        if (!err) {
          tagsWithCounts[index].configurations = configs || [];
        }
        completed++;
        if (completed === rows.length) {
          res.json(tagsWithCounts);
        }
      });
    });
  });
});

app.get('/api/env-tags/:id', (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM env_tags WHERE id = ?", [id], (err, tag) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    db.all("SELECT * FROM env_configurations WHERE tag_id = ?", [id], (err, configs) => {
      if (err) return res.status(500).json({ error: err.message });
      tag.configurations = configs;
      res.json(tag);
    });
  });
});

app.post('/api/env-tags', (req, res) => {
  const { name, description, icon, color, configurations } = req.body;
  const id = uuidv4();

  db.run(
    "INSERT INTO env_tags (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)",
    [id, name, description, icon, color],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      if (configurations && configurations.length > 0) {
        const stmt = db.prepare("INSERT INTO env_configurations (id, tag_id, key, value, description) VALUES (?, ?, ?, ?, ?)");
        configurations.forEach(config => {
          stmt.run([uuidv4(), id, config.key, config.value, config.description]);
        });
        stmt.finalize();
      }

      res.json({ id, name, description, icon, color, configurations });
    }
  );
});

app.put('/api/env-tags/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, icon, color, configurations } = req.body;

  db.run(
    "UPDATE env_tags SET name = ?, description = ?, icon = ?, color = ? WHERE id = ?",
    [name, description, icon, color, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // 更新配置
      db.run("DELETE FROM env_configurations WHERE tag_id = ?", [id], (err) => {
        if (!err && configurations && configurations.length > 0) {
          const stmt = db.prepare("INSERT INTO env_configurations (id, tag_id, key, value, description) VALUES (?, ?, ?, ?, ?)");
          configurations.forEach(config => {
            stmt.run([uuidv4(), id, config.key, config.value, config.description]);
          });
          stmt.finalize();
        }
      });

      res.json({ message: "Environment tag updated" });
    }
  );
});

app.delete('/api/env-tags/:id', (req, res) => {
  db.run("DELETE FROM env_tags WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Environment tag deleted" });
  });
});

// ==================== IDE标签 API ====================
app.get('/api/ide-tags', (req, res) => {
  db.all("SELECT * FROM ide_tags ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/ide-tags/:id', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM ide_tags WHERE id = ?", [id], (err, tag) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!tag) return res.status(404).json({ error: "IDE tag not found" });
    res.json(tag);
  });
});

app.post('/api/ide-tags', (req, res) => {
  const { name, executable_path, command_args, description, icon, color } = req.body;
  const id = uuidv4();

  db.run(
    "INSERT INTO ide_tags (id, name, executable_path, command_args, description, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, name, executable_path, command_args, description, icon, color],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, executable_path, command_args, description, icon, color });
    }
  );
});

app.put('/api/ide-tags/:id', (req, res) => {
  const { id } = req.params;
  const { name, executable_path, command_args, description, icon, color } = req.body;

  db.run(
    "UPDATE ide_tags SET name = ?, executable_path = ?, command_args = ?, description = ?, icon = ?, color = ? WHERE id = ?",
    [name, executable_path, command_args, description, icon, color, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "IDE tag updated" });
    }
  );
});

app.delete('/api/ide-tags/:id', (req, res) => {
  db.run("DELETE FROM ide_tags WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "IDE tag deleted" });
  });
});

// ==================== 项目 API ====================
app.get('/api/projects', (req, res) => {
  const { group_id } = req.query;

  let query = "SELECT * FROM projects";
  const params = [];

  if (group_id) {
    query += " WHERE group_id = ?";
    params.push(group_id);
  }

  query += " ORDER BY created_at DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM projects WHERE id = ?", [id], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });
});

app.post('/api/projects', (req, res) => {
  const { name, description, path, group_id, default_cli_tag, default_env_tag, default_ide_tag } = req.body;
  const id = uuidv4();

  db.run(
    "INSERT INTO projects (id, name, description, path, group_id, default_cli_tag, default_env_tag, default_ide_tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, name, description, path, group_id, default_cli_tag, default_env_tag, default_ide_tag],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, description, path, group_id, default_cli_tag, default_env_tag, default_ide_tag });
    }
  );
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, path, group_id, default_cli_tag, default_env_tag, default_ide_tag } = req.body;

  // 直接更新项目
  const updateQuery = `
    UPDATE projects
    SET name = ?,
        description = ?,
        path = ?,
        group_id = ?,
        default_cli_tag = ?,
        default_env_tag = ?,
        default_ide_tag = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const updateParams = [name, description, path, group_id, default_cli_tag, default_env_tag, default_ide_tag, id];

  db.run(updateQuery, updateParams, function(err) {
    if (err) {
      console.error('Database update error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found or no changes made' });
    }

    res.json({
      message: "Project updated successfully"
    });
  });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: '项目ID不能为空' });
  }

  db.run("DELETE FROM projects WHERE id = ?", [id], function(err) {
    if (err) return handleDbError(err, res, '删除项目');

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: "项目删除成功" });
  });
});

// 启动项目 - 支持选择CLI和环境
app.post('/api/projects/:id/start', async (req, res) => {
  const { id } = req.params;
  const { cli_tag_id, env_tag_id } = req.body;

  try {
    // 获取项目信息
    const project = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 使用传入的标签或默认标签
    const cliTagId = cli_tag_id || project.default_cli_tag;
    const envTagId = env_tag_id || project.default_env_tag;

    // 获取CLI命令
    const cliTag = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM cli_tags WHERE id = ?", [cliTagId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!cliTag) {
      return res.status(400).json({ error: "CLI tag not found" });
    }

    // 获取环境配置
    let envConfigs = [];
    if (envTagId) {
      envConfigs = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM env_configurations WHERE tag_id = ?", [envTagId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    }

    const sessionId = uuidv4();

    // 构建环境变量命令
    let envCommands = [];
    if (envConfigs && envConfigs.length > 0) {
      envConfigs
        .filter(c => c.value && c.value.trim() !== '')
        .forEach(c => {
          envCommands.push(`set ${c.key}=${c.value}`);
        });
    }

    // 构建批处理命令
    const commands = [
      `title ${project.name} - ${cliTag.name}`,
      `cd /d "${project.path}"`,
      ...envCommands,
      cliTag.command
    ].join(' && ');

    // 使用标准的 Windows CMD 启动
    exec(`start cmd /k "${commands}"`, {
      windowsHide: false
    }, (error) => {
      if (error && error.code !== 0) {
        console.error('Launch warning:', error.message);
      }
    });

    // 记录会话
    activeSessions.set(sessionId, {
      projectId: id,
      project: project,
      cliTag: cliTag.name,
      envTag: envTagId ? 'Applied' : 'None',
      startedAt: new Date(),
      status: 'running'
    });

    res.json({
      sessionId,
      projectId: id,
      status: 'started',
      message: `Project launched with ${cliTag.name}`
    });

  } catch (error) {
    console.error('Launch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动IDE打开项目
app.post('/api/projects/:id/open-ide', async (req, res) => {
  const { id } = req.params;
  const { ide_tag_id } = req.body;

  try {
    // 获取项目信息
    const project = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 使用传入的IDE标签或默认IDE标签
    const ideTagId = ide_tag_id || project.default_ide_tag;

    if (!ideTagId) {
      return res.status(400).json({ error: "No IDE configured for this project" });
    }

    // 获取IDE配置
    const ideTag = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM ide_tags WHERE id = ?", [ideTagId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!ideTag) {
      return res.status(400).json({ error: "IDE configuration not found" });
    }

    // 构建命令
    const command = `${ideTag.executable_path} ${ideTag.command_args || '.'} "${project.path}"`;

    // 执行命令启动IDE
    exec(command, { cwd: project.path }, (error, stdout, stderr) => {
      if (error) {
        console.error('IDE launch error:', error.message);
      }
      // 即使有错误也不阻塞响应，因为IDE可能在后台启动
    });

    res.json({
      projectId: id,
      ideTag: ideTag.name,
      status: 'launched',
      message: `Opening project in ${ideTag.name}`
    });

  } catch (error) {
    console.error('IDE launch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 扫描并自动导入项目
app.post('/api/projects/scan', async (req, res) => {
  const { scan_path: scanPath, group_id } = req.body;

  if (!scanPath) {
    return res.status(400).json({ error: '扫描路径不能为空' });
  }

  try {
    const directories = await fs.readdir(scanPath, { withFileTypes: true });
    const projects = [];

    for (const dir of directories) {
      if (dir.isDirectory()) {
        const projectPath = path.join(scanPath, dir.name);

        // 检查是否已存在
        const exists = await new Promise((resolve) => {
          db.get("SELECT id FROM projects WHERE path = ?", [projectPath], (err, row) => {
            resolve(!!row);
          });
        });

        if (!exists) {
          // 检查是否是代码项目
          const hasProjectFiles = await checkProjectFiles(projectPath);
          if (hasProjectFiles) {
            projects.push({
              name: dir.name,
              path: projectPath,
              description: `Auto-imported from ${scanPath}`,
              group_id: group_id
            });
          }
        }
      }
    }

    // 批量添加项目
    const addedProjects = [];
    for (const project of projects) {
      const id = uuidv4();
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO projects (id, name, description, path, group_id) VALUES (?, ?, ?, ?, ?)",
          [id, project.name, project.description, project.path, project.group_id],
          function(err) {
            if (err) reject(err);
            else {
              addedProjects.push({ ...project, id });
              resolve();
            }
          }
        );
      });
    }

    res.json({
      message: `Scanned and added ${addedProjects.length} projects`,
      projects: addedProjects
    });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Health Check ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'VibeCoding Project Gallery API is running',
    timestamp: new Date().toISOString(),
    features: {
      projectGroups: true,
      cliTags: true,
      envTags: true,
      folderDialog: true,
      autoScan: true
    }
  });
});

// 文件对话框选择（通过PowerShell）
app.post('/api/dialog/folder', (req, res) => {
  const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select Project Folder'; $d.ShowNewFolderButton = $false; $d.RootFolder = [System.Environment+SpecialFolder]::MyComputer; if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.SelectedPath }`;
  
  // 移除 -NonInteractive 参数以允许GUI对话框显示
  exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, {
    windowsHide: false,
    timeout: 60000 // 60秒超时
  }, (error, stdout, stderr) => {
    if (error) {
      console.error('Dialog error:', error);
      return res.status(500).json({ error: 'Failed to open dialog' });
    }
    const selectedPath = (stdout || '').toString().trim();
    res.json({ path: selectedPath || null });
  });
});

async function checkProjectFiles(dirPath) {
  const projectIndicators = [
    'package.json', 'pom.xml', 'build.gradle', '.git',
    'requirements.txt', 'setup.py', 'Cargo.toml', 'go.mod',
    '.project', 'CMakeLists.txt', 'Makefile', '.vscode', '.idea'
  ];
  try {
    const files = await fs.readdir(dirPath);
    return projectIndicators.some(indicator => files.includes(indicator));
  } catch {
    return false;
  }
}

// 打开文件夹
app.post('/api/projects/open-folder', (req, res) => {
  const { path: folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: '文件夹路径不能为空' });
  }

  exec(`explorer "${folderPath}"`, (error) => {
    if (error) {
      console.error('Error opening folder:', error);
      return res.status(500).json({ error: 'Failed to open folder' });
    }
    res.json({ message: 'Folder opened' });
  });
});

// 生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// 错误处理中间件（必须放在最后）
app.use(handleError);

const PORT = process.env.PORT || 5000;
const APP_NAME = process.env.APP_NAME || 'VibeCoding Project Gallery';

server.listen(PORT, () => {
  console.log(`${APP_NAME} server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${dbPath}`);
});