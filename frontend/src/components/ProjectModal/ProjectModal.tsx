import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Divider, message, Select, Tag } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  Project,
  ProjectGroup,
  CLITag,
  EnvTag,
  IDETag,
  groupApi,
  cliTagApi,
  envTagApi,
  ideTagApi,
  dialogApi
} from '../../services/api';

interface ProjectModalProps {
  visible: boolean;
  project?: Project | null;
  onCancel: () => void;
  onOk: (values: Partial<Project>) => Promise<boolean>;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  visible,
  project,
  onCancel,
  onOk,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [cliTags, setCliTags] = useState<CLITag[]>([]);
  const [envTags, setEnvTags] = useState<EnvTag[]>([]);
  const [ideTags, setIdeTags] = useState<IDETag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      (async () => {
        setLoading(true);
        try {
          const [groupsRes, cliRes, envRes, ideRes] = await Promise.all([
            groupApi.getAll(),
            cliTagApi.getAll(),
            envTagApi.getAll(),
            ideTagApi.getAll()
          ]);
          setGroups(groupsRes.data);
          setCliTags(cliRes.data);
          setEnvTags(envRes.data);
          setIdeTags(ideRes.data);
          if (project) {
            // 只设置表单需要的字段，避免数据污染
            form.setFieldsValue({
              name: project.name,
              description: project.description,
              path: project.path,
              group_id: project.group_id,
              default_cli_tag: project.default_cli_tag,
              default_env_tag: project.default_env_tag,
              default_ide_tag: project.default_ide_tag
            });
          } else {
            form.resetFields();
          }
        } catch (error) {
          message.error(t('messages.loadFailed'));
        } finally {
          setLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, project]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const ok = await onOk(values);

      if (ok) {
        form.resetFields();
        // onOk already handles modal closing and success message display
        // Don't call onCancel here to avoid closing modal twice
      }
    } catch (error) {
      // validation or submit failed; keep form values for user to adjust
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseFolder = async () => {
    try {
      const result = await dialogApi.selectFolder();
      if (result.data.path) {
        form.setFieldValue('path', result.data.path);

        // Auto-fill name if empty
        const currentName = form.getFieldValue('name');
        if (!currentName) {
          const folderName = result.data.path.split('\\').pop() || result.data.path.split('/').pop();
          form.setFieldValue('name', folderName);
        }
      }
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  return (
    <Modal
      title={project ? t('modal.editProject') : t('modal.newProject')}
      open={visible}
      onCancel={onCancel}
      width={600}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('modal.cancel')}
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>
          {project ? t('modal.update') : t('modal.create')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" style={{ marginBottom: 0 }}>
        <Form.Item
          name="name"
          label={t('modal.projectName')}
          rules={[{ required: true, message: 'Please input project name!' }]}
          style={{ marginBottom: 16 }}
        >
          <Input placeholder={t('modal.projectName')} />
        </Form.Item>

        <Form.Item
          name="description"
          label={t('modal.projectDescription')}
          style={{ marginBottom: 16 }}
        >
          <Input.TextArea rows={2} placeholder={t('modal.projectDescription')} />
        </Form.Item>

        <Form.Item
          name="path"
          label={t('modal.projectPath')}
          rules={[{ required: true, message: t('messages.pleaseInputPath') }]}
          style={{ marginBottom: 16 }}
        >
          <Input
            placeholder={t("scan.placeholder")}
            addonAfter={
              <Button
                icon={<FolderOpenOutlined />}
                size="small"
                type="text"
                onClick={handleBrowseFolder}
              > {t('modal.browse')} </Button>
            }
          />
        </Form.Item>

        <Divider style={{ margin: '16px 0' }}>{t('modal.advancedSettings')}</Divider>

        <Form.Item
          name="group_id"
          label={t('modal.projectGroup')}
          tooltip={t('modal.projectGroup')}
          style={{ marginBottom: 12 }}
        >
          <Select
            placeholder={t('modal.selectGroup')}
            allowClear
            showSearch
            optionFilterProp="children"
            size="small"
          >
            {groups.map(group => (
              <Select.Option key={group.id} value={group.id}>
                <Space>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: group.color || '#ccc'
                    }}
                  />
                  {group.name}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="default_cli_tag"
          label={t('modal.defaultCliTool')}
          tooltip={t('modal.defaultCliTool')}
          style={{ marginBottom: 12 }}
        >
          <Select
            placeholder={t('modal.selectCliTool')}
            allowClear
            showSearch
            optionFilterProp="children"
            size="small"
          >
            {cliTags.map(tag => (
              <Select.Option key={tag.id} value={tag.id}>
                <Space>
                  <Tag color={tag.color}>{tag.name}</Tag>
                  <span style={{ color: '#999', fontSize: 11 }}>({tag.command})</span>
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="default_env_tag"
          label={t('modal.defaultEnvironment')}
          tooltip={t('modal.defaultEnvironment')}
          style={{ marginBottom: 12 }}
        >
          <Select
            placeholder={t('modal.selectEnvironment')}
            allowClear
            showSearch
            optionFilterProp="children"
            size="small"
          >
            {envTags.map(tag => (
              <Select.Option key={tag.id} value={tag.id}>
                <Space>
                  <Tag color={tag.color}>{tag.name}</Tag>
                  {tag.description && (
                    <span style={{ color: '#999', fontSize: 11 }}>{tag.description}</span>
                  )}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="default_ide_tag"
          label={t('modal.defaultIDE')}
          tooltip={t('modal.defaultIDE')}
          style={{ marginBottom: 8 }}
        >
          <Select
            placeholder={t('modal.selectIDE')}
            allowClear
            showSearch
            optionFilterProp="children"
            size="small"
          >
            {ideTags.map(tag => (
              <Select.Option key={tag.id} value={tag.id}>
                <Space>
                  <Tag color={tag.color}>{tag.name}</Tag>
                  {tag.description && (
                    <span style={{ color: '#999', fontSize: 11 }}>{tag.description}</span>
                  )}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            <strong>{t('modal.notes.title')}</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#666' }}>
            <li>{t('modal.notes.cli')}</li>
            <li>{t('modal.notes.env')}</li>
            <li>{t('modal.notes.group')}</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};

export default ProjectModal;
