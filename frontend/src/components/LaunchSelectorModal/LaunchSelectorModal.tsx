import React, { useState, useEffect } from 'react';
import { Modal, Select, Space, Spin, Alert } from 'antd';
import { RocketOutlined, CodeOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CLITag, EnvTag, cliTagApi, envTagApi } from '../../services/api';
import './LaunchSelectorModal.css';

interface LaunchSelectorModalProps {
  visible: boolean;
  projectName: string;
  defaultCliTag?: string;
  defaultEnvTag?: string;
  onLaunch: (cliTagId: string, envTagId?: string) => void;
  onCancel: () => void;
}

const LaunchSelectorModal: React.FC<LaunchSelectorModalProps> = ({
  visible,
  projectName,
  defaultCliTag,
  defaultEnvTag,
  onLaunch,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [cliTags, setCliTags] = useState<CLITag[]>([]);
  const [envTags, setEnvTags] = useState<EnvTag[]>([]);
  const [selectedCli, setSelectedCli] = useState<string | undefined>(defaultCliTag);
  const [selectedEnv, setSelectedEnv] = useState<string | undefined>(defaultEnvTag);

  useEffect(() => {
    if (visible) {
      loadTags();
    }
  }, [visible]);

  useEffect(() => {
    setSelectedCli(defaultCliTag);
    setSelectedEnv(defaultEnvTag);
  }, [defaultCliTag, defaultEnvTag]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const [cliRes, envRes] = await Promise.all([
        cliTagApi.getAll(),
        envTagApi.getAll(),
      ]);
      setCliTags(cliRes.data);
      setEnvTags(envRes.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = () => {
    if (selectedCli) {
      onLaunch(selectedCli, selectedEnv);
    }
  };

  const renderCLIOption = (tag: CLITag) => (
    <div className="tag-option">
      <CodeOutlined style={{ color: tag.color, marginRight: 8 }} />
      <span>{tag.name}</span>
      {tag.description && (
        <span className="tag-description"> - {tag.description}</span>
      )}
    </div>
  );

  const renderEnvOption = (tag: EnvTag) => (
    <div className="tag-option">
      <SettingOutlined style={{ color: tag.color, marginRight: 8 }} />
      <span>{tag.name}</span>
      {tag.description && (
        <span className="tag-description"> - {tag.description}</span>
      )}
    </div>
  );

  return (
    <Modal
      title={
        <div className="launch-modal-title">
          <RocketOutlined style={{ marginRight: 8 }} />
          {t('launch.title')}
        </div>
      }
      open={visible}
      onOk={handleLaunch}
      onCancel={onCancel}
      okText={t('launch.launch')}
      cancelText={t('launch.cancel')}
      okButtonProps={{ disabled: !selectedCli, icon: <RocketOutlined /> }}
      width={600}
    >
      {loading ? (
        <div className="launch-loading">
          <Spin spinning tip={t('common.loading')}>
            <div style={{ height: 60 }} />
          </Spin>
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="launch-project-name">
            <h3>{t('launch.projectName', { name: projectName })}</h3>
          </div>

          <div>
            <div className="launch-section-title">
              <CodeOutlined /> {t('launch.selectCli')}
            </div>
            <Select
              value={selectedCli}
              onChange={setSelectedCli}
              style={{ width: '100%' }}
              placeholder={t('launch.selectCli')}
              size="large"
              showSearch
              optionFilterProp="children"
            >
              {cliTags.map(tag => (
                <Select.Option key={tag.id} value={tag.id}>
                  {renderCLIOption(tag)}
                </Select.Option>
              ))}
            </Select>
            {selectedCli && (
              <div className="selected-info">
                {t('settings.cli.command')}: <code>{cliTags.find(t => t.id === selectedCli)?.command}</code>
              </div>
            )}
          </div>

          <div>
            <div className="launch-section-title">
              <SettingOutlined /> {t('launch.selectEnv')}
            </div>
            <Select
              value={selectedEnv}
              onChange={setSelectedEnv}
              style={{ width: '100%' }}
              placeholder={t('launch.selectEnv')}
              size="large"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              <Select.Option value={undefined}>
                {t('launch.noEnv')}
              </Select.Option>
              {envTags.map(tag => (
                <Select.Option key={tag.id} value={tag.id}>
                  {renderEnvOption(tag)}
                </Select.Option>
              ))}
            </Select>
          </div>

          {!selectedCli && (
            <Alert
              message={t('messages.selectCliFirst')}
              type="info"
              showIcon
            />
          )}

          {defaultCliTag && defaultEnvTag && (
            <Alert
              message={t('launch.customLaunch')}
              description={t('modal.notes.cli')}
              type="warning"
              showIcon
            />
          )}
        </Space>
      )}
    </Modal>
  );
};

export default LaunchSelectorModal;
