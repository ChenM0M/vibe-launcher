import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layout, Button, Row, Col, message, Empty, Spin, Modal,
  Input, Tooltip, Select, Space, Menu
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusOutlined,
  ReloadOutlined,
  FolderOpenOutlined,
  ScanOutlined,
  RocketOutlined,
  GlobalOutlined,
  SettingOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ProjectCard from './components/ProjectCard/ProjectCard';
import ProjectModal from './components/ProjectModal/ProjectModal';
import LaunchSelectorModal from './components/LaunchSelectorModal/LaunchSelectorModal';
import SettingsPage from './components/SettingsPage/SettingsPage';
import { AnimatedButton } from './components/AnimatedButton';
import {
  projectApi,
  groupApi,
  cliTagApi,
  envTagApi,
  ideTagApi,
  dialogApi,
  Project,
  ProjectGroup,
  CLITag,
  EnvTag,
  IDETag
} from './services/api';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const { t, i18n } = useTranslation();

  // State Management
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [cliTags, setCliTags] = useState<CLITag[]>([]);
  const [envTags, setEnvTags] = useState<EnvTag[]>([]);
  const [ideTags, setIdeTags] = useState<IDETag[]>([]);

  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('projects');
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scanPath, setScanPath] = useState('');
  const [launchModalVisible, setLaunchModalVisible] = useState(false);
  const [launchingProject, setLaunchingProject] = useState<Project | null>(null);

  const [runningProjects, setRunningProjects] = useState<Set<string>>(new Set());
  const lastReorderTsRef = useRef<number>(0);
  const REORDER_GRACE_MS = 2000;
  
  // Persisted ordering helpers (per group or all)
  const getOrderKey = (groupId?: string) => `projectOrder:${groupId || 'all'}`;
  const saveOrder = (ids: string[], groupId?: string) => {
    localStorage.setItem(getOrderKey(groupId), JSON.stringify(ids));
  };
  const sortByOrder = useCallback((list: Project[] | unknown, groupId?: string): Project[] => {
    if (!Array.isArray(list)) return [];
    let order: string[] = [];
    try {
      const raw = localStorage.getItem(getOrderKey(groupId));
      order = raw ? JSON.parse(raw) : [];
    } catch {
      order = [];
    }
    if (!order.length) return list as Project[];
    const pos = new Map(order.map((id, idx) => [id, idx]));
    return [...(list as Project[])].sort((a, b) => {
      const ai = pos.has(a.id) ? (pos.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
      const bi = pos.has(b.id) ? (pos.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
  }, []);
  // 通用错误处理函数
  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('API Error:', error);
    const errorMessage = error?.response?.data?.error || error?.message || defaultMessage;
    message.error(errorMessage);
  };

  // 加载所有数据的通用函数
  const loadAllData = async (groupFilter?: string) => {
    try {
      const [projectsRes, groupsRes, cliRes, envRes, ideRes] = await Promise.all([
        projectApi.getAll(groupFilter),
        groupApi.getAll(),
        cliTagApi.getAll(),
        envTagApi.getAll(),
        ideTagApi.getAll()
      ]);

      // 确保项目数据存在且为数组
      const projectsData = Array.isArray(projectsRes?.data) ? projectsRes.data : [];
      setProjects(sortByOrder(projectsData, groupFilter));

      setGroups(Array.isArray(groupsRes?.data) ? groupsRes.data : []);
      setCliTags(Array.isArray(cliRes?.data) ? cliRes.data : []);
      setEnvTags(Array.isArray(envRes?.data) ? envRes.data : []);
      setIdeTags(Array.isArray(ideRes?.data) ? ideRes.data : []);
    } catch (error) {
      handleApiError(error, t('messages.loadFailed'));
    }
  };

  // Manual refresh: reload everything
  const refreshAll = async () => {
    setLoading(true);
    try {
      await loadAllData(selectedGroup);
    } catch (error) {
      console.error('Refresh failed:', error);
      handleApiError(error, t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Initial data load (projects + groups + tags)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadAllData();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload projects when selected group changes
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup]);

  // Auto-refresh on scan folder changes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!modalVisible && !scanModalVisible && !launchModalVisible) {
        // Silent refresh without loading animation
        try {
          // If we just reordered, avoid jarring updates for a brief window
          const now = Date.now();
          const response = await projectApi.getAll(selectedGroup);
          const sorted = sortByOrder(response.data, selectedGroup);
          if (now - lastReorderTsRef.current < REORDER_GRACE_MS) {
            // Skip overriding immediately after manual reorder
            return;
          }
          setProjects(sorted);
        } catch (error) {
          // Silent fail
        }
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [modalVisible, scanModalVisible, launchModalVisible, selectedGroup, sortByOrder]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.getAll(selectedGroup);
      setProjects(sortByOrder(response?.data, selectedGroup));
    } catch (error) {
      message.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (values: Partial<Project>): Promise<boolean> => {
    try {
      if (editingProject) {
        // Only send the fields that should be updated
        const body = {
          name: values.name,
          description: values.description,
          path: values.path,
          group_id: values.group_id,
          default_cli_tag: values.default_cli_tag,
          default_env_tag: values.default_env_tag,
          default_ide_tag: values.default_ide_tag
        };

        await projectApi.update(editingProject.id, body);

        // 先刷新数据
        await refreshAll();

        // 显示成功消息
        message.success(t('messages.projectUpdated'));
      } else {
        await projectApi.create(values);

        // 先刷新数据
        await refreshAll();

        // 显示成功消息
        message.success(t('messages.projectCreated'));
      }

      // 延迟关闭模态框，确保用户看到成功消息和数据更新
      setTimeout(() => {
        setModalVisible(false);
        setEditingProject(null);
      }, 1500);

      return true;
    } catch (error: any) {
      handleApiError(error, t('messages.operationFailed'));
      return false;
    }
  };

  const handleStart = async (project: Project) => {
    // Check if project has defaults
    if (project.default_cli_tag) {
      // Direct launch with defaults
      try {
        setRunningProjects(prev => new Set(prev).add(project.id));
        const response = await projectApi.start(
          project.id,
          project.default_cli_tag,
          project.default_env_tag
        );
        message.success(response.data.message || t('messages.launching'));

        setTimeout(() => {
          setRunningProjects(prev => {
            const newSet = new Set(prev);
            newSet.delete(project.id);
            return newSet;
          });
        }, 3000);
      } catch (error) {
        setRunningProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(project.id);
          return newSet;
        });
        message.error(t('messages.launchFailed'));
      }
    } else {
      // Show launch selector modal
      setLaunchingProject(project);
      setLaunchModalVisible(true);
    }
  };

  const handleLaunchWithConfig = async (cliTagId: string, envTagId?: string) => {
    if (!launchingProject) return;

    try {
      setRunningProjects(prev => new Set(prev).add(launchingProject.id));
      setLaunchModalVisible(false);

      const response = await projectApi.start(
        launchingProject.id,
        cliTagId,
        envTagId
      );

      message.success(response.data.message || t('messages.launching'));

      setTimeout(() => {
        setRunningProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(launchingProject.id);
          return newSet;
        });
      }, 3000);

      setLaunchingProject(null);
    } catch (error) {
      setRunningProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(launchingProject.id);
        return newSet;
      });
      message.error(t('messages.launchFailed'));
    }
  };

  const handleStop = async (project: Project) => {
    setRunningProjects(prev => {
      const newSet = new Set(prev);
      newSet.delete(project.id);
      return newSet;
    });
    message.info(t('messages.closeManually'));
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setModalVisible(true);
  };

  const handleDelete = (project: Project) => {
    Modal.confirm({
      title: t('messages.deleteTitle'),
      content: t('messages.deleteConfirm', { name: project.name }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // 立即从本地状态中移除项目，提供即时反馈
          // 删除前不做本地移除，待服务端成功后再更新状态

          // 调用删除API
          await projectApi.delete(project.id);

          // 从持久化排序中移除该项目（全局与其所在分组）
          try {
            const keyAll = `projectOrder:all`;
            const rawAll = localStorage.getItem(keyAll);
            if (rawAll) {
              const arrAll = JSON.parse(rawAll) as string[];
              localStorage.setItem(keyAll, JSON.stringify(arrAll.filter(id => id !== project.id)));
            }
          } catch {}
          if (project.group_id) {
            try {
              const keyGroup = `projectOrder:${project.group_id}`;
              const rawGroup = localStorage.getItem(keyGroup);
              if (rawGroup) {
                const arrGroup = JSON.parse(rawGroup) as string[];
                localStorage.setItem(keyGroup, JSON.stringify(arrGroup.filter(id => id !== project.id)));
              }
            } catch {}
          }

          // 本地状态移除
          setProjects(prevProjects => prevProjects.filter(p => p.id !== project.id));
          message.success(t('messages.projectDeleted'));

          // 确保数据与服务器同步
          await refreshAll();
        } catch (error: any) {
          console.error('Delete failed:', error);
          // 如果删除失败，恢复项目到列表中
          await refreshAll();

          // 提供更友好的错误信息
          const errorMessage = error?.response?.data?.error || error?.message || t('messages.operationFailed');
          message.error(errorMessage);
        }
      },
    });
  };

  const handleOpenFolder = (project: Project) => {
    projectApi.openFolder(project.path).catch(() => {
      message.warning(project.path);
    });
  };

  const handleOpenIDE = async (project: Project) => {
    try {
      const response = await projectApi.openIDE(project.id, project.default_ide_tag);
      message.success(response.data.message);
    } catch (error) {
      message.error(t('messages.ideOpenFailed'));
    }
  };

  const handleScanProjects = async () => {
    if (!scanPath) {
      message.warning(t('messages.enterPath'));
      return;
    }

    setLoading(true);
    try {
      const result = await projectApi.scan(scanPath, selectedGroup);
      message.success(result.data.message);
      setScanModalVisible(false);
      loadProjects();
    } catch (error) {
      message.error(t('messages.scanFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseForScan = async () => {
    try {
      const result = await dialogApi.selectFolder();
      if (result.data.path) {
        setScanPath(result.data.path);
      }
    } catch (error) {
      message.error('Failed to open folder dialog');
    }
  };

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem('language', value);
    localStorage.setItem('preferredLanguage', value);
  };

  const getCliTagName = (id?: string) => {
    return cliTags.find(tag => tag.id === id)?.name;
  };

  const getEnvTagName = (id?: string) => {
    return envTags.find(tag => tag.id === id)?.name;
  };

  const getIdeTagName = (id?: string) => {
    return ideTags.find(tag => tag.id === id)?.name;
  };

  const getGroupColor = (id?: string) => {
    return groups.find(group => group.id === id)?.color;
  };

  const renderProjects = () => {
    const filteredProjects = selectedGroup
      ? projects.filter(p => p.group_id === selectedGroup)
      : projects;

    if (loading) {
      return (
        <div className="loading-container">
          <Spin spinning tip={t('common.loadingProjects')}>
            <div style={{ height: 80 }} />
          </Spin>
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <Empty
          className="empty-container"
          description={t('common.noProjects')}
        >
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingProject(null);
                setModalVisible(true);
              }}
            >
              {t('common.createFirst')}
            </Button>
            <Button
              size="large"
              icon={<ScanOutlined />}
              onClick={() => setScanModalVisible(true)}
            >
              {t('common.scanForProjects')}
            </Button>
          </Space>
        </Empty>
      );
    }

    return (
      <div className="projects-container">
        <div className="projects-header">
          <h2>
            {selectedGroup
              ? groups.find(g => g.id === selectedGroup)?.name
              : t('common.yourProjects')
            } ({filteredProjects.length})
          </h2>
          <p style={{ opacity: 0.9 }}>{t('common.clickToLaunch')}</p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Row gutter={[20, 20]}>
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <Col
                key={project.id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={6}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', project.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                if (!draggedId || draggedId === project.id) return;
                const to = index;
                // Reorder within current context (group or all)
                setProjects(prev => {
                  const isAll = !selectedGroup;
                  const contextList = isAll ? prev : prev.filter(p => p.group_id === selectedGroup);
                  const from = contextList.findIndex(p => p.id === draggedId);
                  if (from === -1 || to === -1 || from === to) return prev;
                  const newContext = [...contextList];
                  const [moved] = newContext.splice(from, 1);
                  newContext.splice(to, 0, moved);

                  // Persist order for this context
                  const newIds = newContext.map(p => p.id);
                  saveOrder(newIds, selectedGroup);

                  // Rebuild full list while preserving non-context items relative order
                  if (isAll) {
                    lastReorderTsRef.current = Date.now();
                    return newContext;
                  } else {
                    const result: Project[] = [];
                    let ctxIdx = 0;
                    for (const item of prev) {
                      if (item.group_id === selectedGroup) {
                        result.push(newContext[ctxIdx++]);
                      } else {
                        result.push(item);
                      }
                    }
                    lastReorderTsRef.current = Date.now();
                    return result;
                  }
                });
              }}
            >
              <ProjectCard
                project={project}
                isRunning={runningProjects.has(project.id)}
                cliTagName={getCliTagName(project.default_cli_tag)}
                envTagName={getEnvTagName(project.default_env_tag)}
                ideTagName={getIdeTagName(project.default_ide_tag)}
                groupColor={getGroupColor(project.group_id)}
                onStart={handleStart}
                onStop={handleStop}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenFolder={handleOpenFolder}
                onOpenIDE={handleOpenIDE}
              />
              </Col>
            ))}
          </AnimatePresence>
            </Row>
        </motion.div>
      </div>
    );
  };

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <RocketOutlined className="header-icon" />
            <h1
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setActiveView('projects');
              setSelectedGroup(undefined);
            }}
          >
            {t('common.projectGallery')}
          </h1>
          </div>
          <Space className="header-actions" size="middle">
            <Select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="language-selector"
              suffixIcon={<GlobalOutlined />}
            >
              <Select.Option value="en-US">English</Select.Option>
              <Select.Option value="zh-CN">中文</Select.Option>
            </Select>

            <Button
              icon={<SettingOutlined />}
              onClick={() => setActiveView('settings')}
              type={activeView === 'settings' ? 'primary' : 'default'}
            >
              {t('common.settings')}
            </Button>

            <Tooltip title={t('common.scanFolder')}>
              <AnimatedButton
                icon={<ScanOutlined />}
                onClick={() => setScanModalVisible(true)}
              >
                {t('common.scanFolder')}
              </AnimatedButton>
            </Tooltip>

            <AnimatedButton
              icon={<ReloadOutlined />}
              onClick={refreshAll}
            >
              {t('common.refresh')}
            </AnimatedButton>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingProject(null);
                setModalVisible(true);
              }}
            >
              {t('common.newProject')}
            </Button>
          </Space>
        </div>
      </Header>

      <Layout>
        {activeView === 'projects' && (
          <Sider width={200} className="app-sider" theme="light">
            <Menu
              mode="inline"
              selectedKeys={[selectedGroup || 'all']}
              onClick={({ key }) => {
                if (key === 'all') setSelectedGroup(undefined);
                else setSelectedGroup(String(key));
              }}
              style={{ height: '100%', borderRight: 0 }}
              items={[
                {
                  key: 'all',
                  icon: <AppstoreOutlined />,
                  label: `${t('common.allProjects')} (${projects.length})`,
                },
                { type: 'divider' as const },
                ...groups.map(group => ({
                  key: group.id,
                  icon: (
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: group.color || '#ccc',
                        display: 'inline-block'
                      }}
                    />
                  ),
                  label: `${group.name} (${projects.filter(p => p.group_id === group.id).length})`,
                }))
              ]}
            />
          </Sider>
        )}

        <Content className="app-content">
          <div className="content-wrapper">
            {activeView === 'projects' ? (
              renderProjects()
            ) : activeView === 'settings' ? (
              <div>
                <Button
                  icon={<AppstoreOutlined />}
                  onClick={() => setActiveView('projects')}
                  style={{ marginBottom: 16 }}
                  type="primary"
                >
                  {t('common.backToProjects')}
                </Button>
                <SettingsPage />
              </div>
            ) : null}
          </div>
        </Content>
      </Layout>

      {/* Project Modal */}
      <ProjectModal
        visible={modalVisible}
        project={editingProject}
        onCancel={() => {
          setModalVisible(false);
          setEditingProject(null);
        }}
        onOk={handleCreateOrUpdate}
      />

      {/* Launch Selector Modal */}
      <LaunchSelectorModal
        visible={launchModalVisible}
        projectName={launchingProject?.name || ''}
        defaultCliTag={launchingProject?.default_cli_tag}
        defaultEnvTag={launchingProject?.default_env_tag}
        onLaunch={handleLaunchWithConfig}
        onCancel={() => {
          setLaunchModalVisible(false);
          setLaunchingProject(null);
        }}
      />

      {/* Scan Modal */}
      <Modal
        title={
          <div>
            <ScanOutlined style={{ marginRight: 8 }} />
            {t('scan.title')}
          </div>
        }
        open={scanModalVisible}
        onCancel={() => setScanModalVisible(false)}
        onOk={handleScanProjects}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 10 }}>
          <p>{t('scan.enterPath')}</p>
          <Input
            placeholder={t('scan.placeholder')}
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            addonAfter={
              <Button
                icon={<FolderOpenOutlined />}
                size="small"
                type="text"
                onClick={handleBrowseForScan}
              >
                {t('scan.browse')}
              </Button>
            }
            size="large"
          />
          <p style={{ marginTop: 10, color: '#666', fontSize: 12 }}>
            {t('scan.hint')}
          </p>
        </div>
      </Modal>
    </Layout>
  );
}

export default App;
