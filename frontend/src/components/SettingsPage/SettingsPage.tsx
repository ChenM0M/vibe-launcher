import React, { useState, useEffect } from 'react';
import { Tabs, Card, Table, Button, Space, Tag, Modal, Form, Input, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CodeOutlined,
  SettingOutlined,
  FolderOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CLITag, EnvTag, IDETag, ProjectGroup, cliTagApi, envTagApi, ideTagApi, groupApi } from '../../services/api';
import './SettingsPage.css';

const { TabPane } = Tabs;

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('cli');

  // CLI Tags State
  const [cliTags, setCliTags] = useState<CLITag[]>([]);
  const [cliModalVisible, setCliModalVisible] = useState(false);
  const [editingCli, setEditingCli] = useState<CLITag | null>(null);
  const [cliForm] = Form.useForm();

  // Env Tags State
  const [envTags, setEnvTags] = useState<EnvTag[]>([]);
  const [envModalVisible, setEnvModalVisible] = useState(false);
  const [editingEnv, setEditingEnv] = useState<EnvTag | null>(null);
  const [envForm] = Form.useForm();

  // IDE Tags State
  const [ideTags, setIdeTags] = useState<IDETag[]>([]);
  const [ideModalVisible, setIdeModalVisible] = useState(false);
  const [editingIde, setEditingIde] = useState<IDETag | null>(null);
  const [ideForm] = Form.useForm();

  // Groups State
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProjectGroup | null>(null);
  const [groupForm] = Form.useForm();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cliRes, envRes, ideRes, groupRes] = await Promise.all([
          cliTagApi.getAll(),
          envTagApi.getAll(),
          ideTagApi.getAll(),
          groupApi.getAll()
        ]);
        setCliTags(cliRes.data);
        setEnvTags(envRes.data);
        setIdeTags(ideRes.data);
        setGroups(groupRes.data);
      } catch (error) {
        message.error(t('messages.loadFailed'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cliRes, envRes, ideRes, groupRes] = await Promise.all([
        cliTagApi.getAll(),
        envTagApi.getAll(),
        ideTagApi.getAll(),
        groupApi.getAll()
      ]);
      setCliTags(cliRes.data);
      setEnvTags(envRes.data);
      setIdeTags(ideRes.data);
      setGroups(groupRes.data);
    } catch (error) {
      message.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // CLI Tag Management
  const handleCliSubmit = async () => {
    try {
      const values = await cliForm.validateFields();
      if (editingCli) {
        await cliTagApi.update(editingCli.id, values);
        message.success(t('settings.updated'));
      } else {
        await cliTagApi.create(values);
        message.success(t('settings.created'));
      }
      setCliModalVisible(false);
      setEditingCli(null);
      cliForm.resetFields();
      loadData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  const handleCliDelete = async (id: string) => {
    try {
      await cliTagApi.delete(id);
      message.success(t('settings.deleted'));
      loadData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  // Env Tag Management
  const handleEnvSubmit = async () => {
    try {
      const values = await envForm.validateFields();
      if (editingEnv) {
        await envTagApi.update(editingEnv.id, values);
        message.success(t('settings.updated'));
      } else {
        await envTagApi.create(values);
        message.success(t('settings.created'));
      }
      setEnvModalVisible(false);
      setEditingEnv(null);
      envForm.resetFields();
      loadData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  const handleEnvDelete = async (id: string) => {
    try {
      await envTagApi.delete(id);
      message.success(t('settings.deleted'));
      loadData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  // IDE Tag Management
  const handleIdeSubmit = async () => {
    try {
      const values = await ideForm.validateFields();
      if (editingIde) {
        await ideTagApi.update(editingIde.id, values);
        message.success(t('settings.updated'));
      } else {
        await ideTagApi.create(values);
        message.success(t('settings.created'));
      }
      setIdeModalVisible(false);
      setEditingIde(null);
      ideForm.resetFields();
      loadData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  const handleIdeDelete = async (id: string) => {
    try {
      await ideTagApi.delete(id);
      message.success(t('settings.deleted'));
      loadData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  // Group Management
  const handleGroupSubmit = async () => {
    try {
      const values = await groupForm.validateFields();
      if (editingGroup) {
        // Update not implemented in backend yet
        message.info(t('settings.updated'));
      } else {
        await groupApi.create(values);
        message.success(t('settings.created'));
      }
      setGroupModalVisible(false);
      setEditingGroup(null);
      groupForm.resetFields();
      loadData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  const handleGroupDelete = async (id: string) => {
    try {
      await groupApi.delete(id);
      message.success(t('settings.deleted'));
      loadData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  const cliColumns = [
    {
      title: t('settings.cli.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CLITag) => (
        <Space>
          <CodeOutlined style={{ color: record.color }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: t('settings.cli.command'),
      dataIndex: 'command',
      key: 'command',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: t('settings.cli.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: CLITag) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingCli(record);
              cliForm.setFieldsValue(record);
              setCliModalVisible(true);
            }}
          />
          <Popconfirm
            title={t('settings.cli.confirmDelete', { name: record.name })}
            onConfirm={() => handleCliDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const envColumns = [
    {
      title: t('settings.env.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: EnvTag) => (
        <Space>
          <SettingOutlined style={{ color: record.color }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: t('settings.env.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('settings.env.variables'),
      key: 'configs',
      render: (_: any, record: EnvTag) => (
        <Tag>{t('settings.env.variableCount', { count: record.configurations?.length || 0 })}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: EnvTag) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingEnv(record);
              envTagApi.getById(record.id).then(res => {
                envForm.setFieldsValue(res.data);
                setEnvModalVisible(true);
              });
            }}
          />
          <Popconfirm
            title={t('settings.env.confirmDelete', { name: record.name })}
            onConfirm={() => handleEnvDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const ideColumns = [
    {
      title: t('settings.ide.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: IDETag) => (
        <Space>
          <AppstoreOutlined style={{ color: record.color }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: t('settings.ide.executable'),
      dataIndex: 'executable_path',
      key: 'executable_path',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: t('settings.ide.arguments'),
      dataIndex: 'command_args',
      key: 'command_args',
      render: (text: string) => text ? <code>{text}</code> : <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: t('settings.ide.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: IDETag) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingIde(record);
              ideForm.setFieldsValue(record);
              setIdeModalVisible(true);
            }}
          />
          <Popconfirm
            title={t('settings.ide.confirmDelete', { name: record.name })}
            onConfirm={() => handleIdeDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const groupColumns = [
    {
      title: t('settings.group.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ProjectGroup) => (
        <Space>
          <FolderOutlined style={{ color: record.color }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: t('settings.group.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: ProjectGroup) => (
        <Space>
          <Popconfirm
            title={t('settings.group.confirmDelete', { name: record.name })}
            onConfirm={() => handleGroupDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="settings-page">
      <Card title={t('settings.title')} className="settings-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><CodeOutlined /> {t('settings.tabs.cliTools')}</span>} key="cli">
            <div className="tab-content">
              <div className="tab-header">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingCli(null);
                    cliForm.resetFields();
                    setCliModalVisible(true);
                  }}
                >
                  {t('settings.cli.add')}
                </Button>
              </div>
              <Table
                dataSource={cliTags}
                columns={cliColumns}
                rowKey="id"
                loading={loading}
              />
            </div>
          </TabPane>

          <TabPane tab={<span><SettingOutlined /> {t('settings.tabs.envTags')}</span>} key="env">
            <div className="tab-content">
              <div className="tab-header">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingEnv(null);
                    envForm.resetFields();
                    setEnvModalVisible(true);
                  }}
                >
                  {t('settings.env.add')}
                </Button>
              </div>
              <Table
                dataSource={envTags}
                columns={envColumns}
                rowKey="id"
                loading={loading}
              />
            </div>
          </TabPane>

          <TabPane tab={<span><AppstoreOutlined /> {t('settings.tabs.ideTools')}</span>} key="ide">
            <div className="tab-content">
              <div className="tab-header">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingIde(null);
                    ideForm.resetFields();
                    setIdeModalVisible(true);
                  }}
                >
                  {t('settings.ide.add')}
                </Button>
              </div>
              <Table
                dataSource={ideTags}
                columns={ideColumns}
                rowKey="id"
                loading={loading}
              />
            </div>
          </TabPane>

          <TabPane tab={<span><FolderOutlined /> {t('settings.tabs.projectGroups')}</span>} key="groups">
            <div className="tab-content">
              <div className="tab-header">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingGroup(null);
                    groupForm.resetFields();
                    setGroupModalVisible(true);
                  }}
                >
                  {t('settings.group.add')}
                </Button>
              </div>
              <Table
                dataSource={groups}
                columns={groupColumns}
                rowKey="id"
                loading={loading}
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* CLI Tag Modal */}
      <Modal
        title={editingCli ? t('settings.cli.edit') : t('settings.cli.add')}
        open={cliModalVisible}
        onOk={handleCliSubmit}
        onCancel={() => {
          setCliModalVisible(false);
          setEditingCli(null);
          cliForm.resetFields();
        }}
      >
        <Form form={cliForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('settings.cli.name')}
            rules={[{ required: true, message: t('messages.pleaseInputName') }]}
          >
            <Input placeholder={t('settings.cli.name')} />
          </Form.Item>
          <Form.Item
            name="command"
            label={t('settings.cli.command')}
            rules={[{ required: true, message: t('messages.pleaseInputCommand') }]}
          >
            <Input placeholder={t('settings.cli.commandHint')} />
          </Form.Item>
          <Form.Item name="description" label={t('settings.cli.description')}>
            <Input.TextArea placeholder={t('settings.cli.description')} />
          </Form.Item>
          <Form.Item name="color" label={t('settings.cli.color')}>
            <Input type="color" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Env Tag Modal */}
      <Modal
        title={editingEnv ? t('settings.env.edit') : t('settings.env.add')}
        open={envModalVisible}
        onOk={handleEnvSubmit}
        onCancel={() => {
          setEnvModalVisible(false);
          setEditingEnv(null);
          envForm.resetFields();
        }}
        width={700}
      >
        <Form form={envForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('settings.env.name')}
            rules={[{ required: true, message: t('messages.pleaseInputName') }]}
          >
            <Input placeholder={t('settings.env.name')} />
          </Form.Item>
          <Form.Item name="description" label={t('settings.env.description')}>
            <Input.TextArea placeholder={t('settings.env.description')} />
          </Form.Item>
          <Form.Item name="color" label={t('settings.env.color')}>
            <Input type="color" />
          </Form.Item>
          <Form.List name="configurations">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'key']}
                      rules={[{ required: true, message: t('messages.missingKey') }]}
                    >
                      <Input placeholder={t('settings.env.variableName')} style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      rules={[{ required: true, message: t('messages.missingValue') }]}
                    >
                      <Input placeholder={t('settings.env.variableValue')} style={{ width: 250 }} />
                    </Form.Item>
                    <DeleteOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    {t('settings.env.addVariable')}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* IDE Modal */}
      <Modal
        title={editingIde ? t('settings.ide.edit') : t('settings.ide.add')}
        open={ideModalVisible}
        onOk={handleIdeSubmit}
        onCancel={() => {
          setIdeModalVisible(false);
          setEditingIde(null);
          ideForm.resetFields();
        }}
      >
        <Form form={ideForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('settings.ide.name')}
            rules={[{ required: true, message: t('messages.pleaseInputName') }]}
          >
            <Input placeholder={t('settings.ide.name')} />
          </Form.Item>
          <Form.Item
            name="executable_path"
            label={t('settings.ide.executable')}
            rules={[{ required: true, message: t('messages.pleaseInputExecutable') }]}
          >
            <Input placeholder={t('settings.ide.executableHint')} />
          </Form.Item>
          <Form.Item
            name="command_args"
            label={t('settings.ide.arguments')}
          >
            <Input placeholder={t('settings.ide.argumentsHint')} />
          </Form.Item>
          <Form.Item name="description" label={t('settings.ide.description')}>
            <Input.TextArea placeholder={t('settings.ide.description')} />
          </Form.Item>
          <Form.Item name="color" label={t('settings.ide.color')}>
            <Input type="color" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Group Modal */}
      <Modal
        title={editingGroup ? t('settings.group.edit') : t('settings.group.add')}
        open={groupModalVisible}
        onOk={handleGroupSubmit}
        onCancel={() => {
          setGroupModalVisible(false);
          setEditingGroup(null);
          groupForm.resetFields();
        }}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('settings.group.name')}
            rules={[{ required: true, message: t('messages.pleaseInputName') }]}
          >
            <Input placeholder={t('settings.group.name')} />
          </Form.Item>
          <Form.Item name="description" label={t('settings.group.description')}>
            <Input.TextArea placeholder={t('settings.group.description')} />
          </Form.Item>
          <Form.Item name="color" label={t('settings.group.color')}>
            <Input type="color" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
